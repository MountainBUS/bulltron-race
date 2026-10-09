/**
 * Sicherung von Datenbank und Dateien.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/sicherung.ts
 *
 * Es entstehen zwei Dateien je Lauf, benannt nach Datum und Uhrzeit:
 *
 *   <SICHERUNG_DIR>/bulltron-JJJJ-MM-TT-hhmm.db
 *   <SICHERUNG_DIR>/dateien-JJJJ-MM-TT-hhmm.tar.gz
 *
 * Die Datenbank wird NICHT kopiert, sondern mit `VACUUM INTO` weggeschrieben.
 * Ein einfaches `cp` auf eine laufende SQLite-Datei ergibt eine Kopie, die
 * mitten in einer Schreiboperation steht — sie lässt sich oft öffnen und ist
 * trotzdem unvollständig. `VACUUM INTO` erzeugt dagegen einen in sich
 * geschlossenen Stand, auch während der Shop Bestellungen annimmt.
 *
 * In den Dateien steckt alles unter MEDIA_DIR, also auch die Rechnungs-PDFs
 * unter `media/rechnungen`. Fehlt `tar` im Abbild, bricht das Skript nicht ab:
 * die Datenbank ist dann gesichert und der Fehlschlag steht im Protokoll.
 *
 * Aufgeräumt wird nach Anzahl, nicht nach Alter: die jüngsten SICHERUNG_KEEP
 * Stände bleiben stehen (Vorgabe 14), ältere werden gelöscht. Ein Paar aus
 * Datenbank und Dateien zählt dabei als ein Stand.
 *
 * ACHTUNG: Diese Sicherung liegt auf demselben Volume wie die Daten. Sie
 * schützt vor einer missglückten Migration, einem versehentlichen Löschen und
 * einer kaputten Einspielung — nicht vor dem Verlust des Volumes. Die Kopien
 * gehören zusätzlich vom Server herunter.
 */
import { createClient } from '@libsql/client'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import SftpClient from 'ssh2-sftp-client'

const ausfuehren = promisify(execFile)

const DB_URI = process.env.DATABASE_URI || 'file:/data/bulltron.db'
const MEDIEN = process.env.MEDIA_DIR || '/data/media'
const ZIEL = process.env.SICHERUNG_DIR || '/data/sicherung'
const BEHALTEN = Math.max(1, Number(process.env.SICHERUNG_KEEP ?? 14))

/** `file:/data/bulltron.db` und `file:./bulltron.db` ergeben beide den Pfad. */
const dateipfad = (uri: string): string => (uri.startsWith('file:') ? uri.slice(5) : uri)

/** Ortszeit, nicht UTC — der Dateiname soll zu dem Tag passen, den Marco meint. */
const zeitstempel = (): string => {
  const teile = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
  // sv-SE liefert „2026-10-09 15:42"
  return teile.replace(' ', '-').replace(':', '')
}

const lesbar = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const groesse = async (datei: string): Promise<number> => {
  try {
    return (await stat(datei)).size
  } catch {
    return 0
  }
}

const quelle = dateipfad(DB_URI)
const stempel = zeitstempel()

/* Die Sicherung darf nicht innerhalb der gesicherten Verzeichnisse liegen,
   sonst packt tar die vorherigen Stände mit ein und jeder Lauf wird größer
   als der letzte. */
const zielAbs = path.resolve(ZIEL)
const medienAbs = path.resolve(MEDIEN)
if (zielAbs === medienAbs || zielAbs.startsWith(medienAbs + path.sep)) {
  console.error(`Abbruch: Das Sicherungsverzeichnis ${zielAbs} liegt innerhalb von ${medienAbs}.`)
  process.exit(1)
}

await mkdir(zielAbs, { recursive: true })

// ---- Datenbank ------------------------------------------------------------

const dbZiel = path.join(zielAbs, `bulltron-${stempel}.db`)

/* VACUUM INTO bricht ab, wenn die Zieldatei schon da ist. Bei zwei Läufen in
   derselben Minute wäre das der Fall — dann ist der vorhandene Stand aktuell
   genug und wir behalten ihn. */
let dbGeschrieben = false
if ((await groesse(dbZiel)) > 0) {
  console.log(`Datenbank: ${path.basename(dbZiel)} besteht bereits, übersprungen.`)
  dbGeschrieben = true
} else {
  const client = createClient({ url: DB_URI })
  try {
    await client.execute(`VACUUM INTO '${dbZiel.replace(/'/g, "''")}'`)
    dbGeschrieben = true
    console.log(`Datenbank: ${path.basename(dbZiel)} (${lesbar(await groesse(dbZiel))}) aus ${quelle}`)
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : 'unbekannt'
    console.error(`Datenbank konnte nicht gesichert werden: ${text}`)
  } finally {
    client.close()
  }
}

// ---- Dateien --------------------------------------------------------------

const tarZiel = path.join(zielAbs, `dateien-${stempel}.tar.gz`)
let tarGeschrieben = false

try {
  await stat(medienAbs)
  /* -C wechselt in das übergeordnete Verzeichnis, damit im Archiv relative
     Pfade stehen und kein „/data/media" am Anfang jedes Eintrags. */
  await ausfuehren('tar', ['-czf', tarZiel, '-C', path.dirname(medienAbs), path.basename(medienAbs)], {
    maxBuffer: 8 * 1024 * 1024,
  })
  tarGeschrieben = true
  console.log(`Dateien:   ${path.basename(tarZiel)} (${lesbar(await groesse(tarZiel))}) aus ${medienAbs}`)
} catch (fehler) {
  const text = fehler instanceof Error ? fehler.message : 'unbekannt'
  console.error(`Dateien konnten nicht gesichert werden: ${text}`)
  await rm(tarZiel, { force: true })
}

// ---- Aufräumen ------------------------------------------------------------

/* Gezählt werden Stände, nicht Dateien. Ein Stand ist ein Zeitstempel; zu ihm
   gehören die Datenbank und das Archiv. Gelöscht wird erst, wenn mehr als
   BEHALTEN Stände dastehen — und nie der Stand, der gerade entstanden ist. */
const vorhanden = await readdir(zielAbs)
const stempelMuster = /^(?:bulltron|dateien)-(\d{4}-\d{2}-\d{2}-\d{4})\.(?:db|tar\.gz)$/

const staende = [...new Set(vorhanden.map((name) => name.match(stempelMuster)?.[1]).filter(Boolean) as string[])].sort()

const zuAlt = staende.slice(0, Math.max(0, staende.length - BEHALTEN)).filter((s) => s !== stempel)

for (const alt of zuAlt) {
  for (const name of vorhanden.filter((n) => n.includes(`-${alt}.`))) {
    await rm(path.join(zielAbs, name), { force: true })
  }
  console.log(`Entfernt:  Stand ${alt}`)
}

/* Nach dem Aufräumen neu einlesen: `vorhanden` stammt von vorher und würde die
   gerade gelöschten Stände mitzählen. */
const geblieben = await readdir(zielAbs)
const belegt = (await Promise.all(geblieben.map((n) => groesse(path.join(zielAbs, n))))).reduce((a, b) => a + b, 0)
const staendeDanach = new Set(geblieben.map((name) => name.match(stempelMuster)?.[1]).filter(Boolean)).size

console.log(`Fertig — ${staendeDanach} Stände in ${zielAbs}, zusammen etwa ${lesbar(belegt)}.`)

// ---- Zweiter Ablageort ----------------------------------------------------

/* Ohne Zugangsdaten bleibt es bei der Kopie auf dem Server. Das ist ein
   gültiger Betriebszustand, kein Fehler — aber einer, der im Protokoll stehen
   muss, damit niemand die Sicherung für vollständig hält. */
const sftp = {
  host: process.env.SICHERUNG_SFTP_HOST,
  port: Number(process.env.SICHERUNG_SFTP_PORT ?? 22),
  user: process.env.SICHERUNG_SFTP_USER,
  passwort: process.env.SICHERUNG_SFTP_PASSWORD,
  verzeichnis: process.env.SICHERUNG_SFTP_DIR || '/sicherung',
  fingerabdruck: process.env.SICHERUNG_SFTP_FINGERPRINT,
}

let hochgeladen = sftp.host ? false : null

if (!sftp.host || !sftp.user || !sftp.passwort) {
  console.log('\nZweiter Ablageort: nicht eingerichtet, die Sicherung liegt nur auf diesem Server.')
} else {
  const client = new SftpClient()
  try {
    await client.connect({
      host: sftp.host,
      port: sftp.port,
      username: sftp.user,
      password: sftp.passwort,
      readyTimeout: 30_000,
      /* Ohne diese Prüfung nimmt ssh2 jeden Schlüssel an, den die Gegenstelle
         anbietet. Ist kein Fingerabdruck hinterlegt, laden wir trotzdem hoch,
         schreiben den Abdruck aber ins Protokoll — einmal abgelesen und in
         SICHERUNG_SFTP_FINGERPRINT eingetragen, ist die Verbindung ab dann an
         genau diesen Server gebunden. */
      hostVerifier: (schluessel: Buffer) => {
        const abdruck = createHash('sha256').update(schluessel).digest('base64').replace(/=+$/, '')
        if (!sftp.fingerabdruck) {
          console.log(`  Fingerabdruck der Gegenstelle: SHA256:${abdruck}`)
          console.log('  (ungeprüft — in SICHERUNG_SFTP_FINGERPRINT eintragen, dann wird er geprüft)')
          return true
        }
        const erwartet = sftp.fingerabdruck.replace(/^SHA256:/, '').replace(/=+$/, '')
        if (erwartet === abdruck) return true
        console.error(`  Fingerabdruck passt nicht. Erwartet SHA256:${erwartet}, bekommen SHA256:${abdruck}`)
        return false
      },
    })

    console.log(`\nZweiter Ablageort: ${sftp.user}@${sftp.host}:${sftp.verzeichnis}`)

    if (!(await client.exists(sftp.verzeichnis))) {
      await client.mkdir(sftp.verzeichnis, true)
      console.log(`  Verzeichnis angelegt.`)
    }

    for (const datei of [dbZiel, tarZiel]) {
      if ((await groesse(datei)) === 0) continue
      const name = path.basename(datei)
      await client.fastPut(datei, `${sftp.verzeichnis}/${name}`)
      console.log(`  Hochgeladen: ${name}`)
    }

    /* Dieselbe Regel wie lokal, sonst läuft der Webspace voll. Gelöscht wird
       nur, was dem eigenen Namensschema entspricht — was sonst in dem
       Verzeichnis liegt, bleibt unangetastet. */
    const dort = (await client.list(sftp.verzeichnis)).map((e) => e.name)
    const dortStaende = [
      ...new Set(dort.map((name) => name.match(stempelMuster)?.[1]).filter(Boolean) as string[]),
    ].sort()
    for (const alt of dortStaende.slice(0, Math.max(0, dortStaende.length - BEHALTEN)).filter((s) => s !== stempel)) {
      for (const name of dort.filter((n) => stempelMuster.test(n) && n.includes(`-${alt}.`))) {
        await client.delete(`${sftp.verzeichnis}/${name}`)
      }
      console.log(`  Entfernt: Stand ${alt}`)
    }

    hochgeladen = true
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : 'unbekannt'
    console.error(`\nDer zweite Ablageort war nicht erreichbar: ${text}`)
    hochgeladen = false
  } finally {
    try {
      await client.end()
    } catch {
      /* Beim Aufräumen einer schon gescheiterten Verbindung ist ein Fehler ohne Belang. */
    }
  }
}

/* Ein Fehlschlag muss sich im Rückgabewert zeigen, sonst meldet die geplante
   Aufgabe in Coolify Erfolg, obwohl nichts gesichert wurde. */
if (hochgeladen === false) {
  console.error('Die Sicherung liegt nur auf diesem Server.')
  process.exit(1)
}
if (!dbGeschrieben) {
  console.error('Die Datenbank fehlt in dieser Sicherung.')
  process.exit(1)
}
if (!tarGeschrieben) {
  console.error('Die Dateien fehlen in dieser Sicherung.')
  process.exit(1)
}
process.exit(0)
