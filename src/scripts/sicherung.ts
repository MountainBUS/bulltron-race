/**
 * Sicherung von Datenbank und Dateien.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/sicherung.ts
 *   SICHERUNG_TEST=1 node_modules/.bin/payload run src/scripts/sicherung.ts
 *
 * Mit `SICHERUNG_TEST=1` wird NUR die Verbindung zum zweiten Ablageort geprüft und das
 * Zielverzeichnis aufgelistet. Es entsteht keine Sicherung. Gedacht für das
 * Einrichten: eine Zugangsdatenprüfung soll keine 90 MB kosten.
 *
 * Es entstehen sonst zwei Dateien je Lauf, benannt nach Datum und Uhrzeit:
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
 * Stände bleiben stehen (Vorgabe 14), ältere werden gelöscht — lokal wie auf
 * der Gegenstelle. Ein Paar aus Datenbank und Dateien zählt als ein Stand.
 *
 * Der zweite Ablageort läuft über FTP mit TLS (FTPS, explizit). Unverschlüsselt
 * geht nichts hinaus: in der Sicherung stehen Namen, Anschriften und
 * E-Mail-Adressen aller Kunden.
 */
import { createClient } from '@libsql/client'
import { Client as FtpClient } from 'basic-ftp'
import { execFile } from 'node:child_process'
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const ausfuehren = promisify(execFile)

/* Als Umgebungsvariable und nicht als Argument: `payload run` reicht keine
   Argumente an das Skript durch — process.argv enthält dort nur den Node-Pfad
   und den Pfad der Payload-CLI. Ein `--test` käme nie an. */
const NUR_TEST = ['1', 'true', 'ja'].includes(String(process.env.SICHERUNG_TEST ?? '').toLowerCase())

const DB_URI = process.env.DATABASE_URI || 'file:/data/bulltron.db'
const MEDIEN = process.env.MEDIA_DIR || '/data/media'
const ZIEL = process.env.SICHERUNG_DIR || '/data/sicherung'
const BEHALTEN = Math.max(1, Number(process.env.SICHERUNG_KEEP ?? 14))

/* Die Variablen hießen zuerst SICHERUNG_SFTP_*, weil der zweite Ablageort über
   SSH laufen sollte. All-Inkl gibt SSH erst ab dem Premium-Tarif her, deshalb
   jetzt FTPS. Die alten Namen werden weiter gelesen, damit eine bestehende
   Einrichtung nicht stillschweigend aufhört zu arbeiten. */
const umgebung = (name: string): string | undefined =>
  process.env[`SICHERUNG_FTP_${name}`] ?? process.env[`SICHERUNG_SFTP_${name}`]

const ftp = {
  host: umgebung('HOST'),
  port: Number(umgebung('PORT') ?? 21),
  user: umgebung('USER'),
  passwort: umgebung('PASSWORD'),
  verzeichnis: umgebung('DIR') || '/sicherung',
  /* Letzter Ausweg, wenn der Anbieter ein Zertifikat ausliefert, das nicht zum
     Namen passt. Die Verbindung bleibt verschlüsselt, aber ungeprüft — und das
     steht dann auch im Protokoll. */
  tlsUngeprueft: ['1', 'true', 'ja'].includes(String(process.env.SICHERUNG_FTP_TLS_UNGEPRUEFT ?? '').toLowerCase()),
}

const altNamenGesetzt = !process.env.SICHERUNG_FTP_HOST && !!process.env.SICHERUNG_SFTP_HOST

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

const stempelMuster = /^(?:bulltron|dateien)-(\d{4}-\d{2}-\d{2}-\d{4})\.(?:db|tar\.gz)$/

/**
 * Baut die Verbindung auf und legt das Zielverzeichnis an, falls es fehlt.
 * Der Aufrufer schließt die Verbindung.
 */
const verbinden = async (): Promise<FtpClient> => {
  const client = new FtpClient(30_000)
  await client.access({
    host: ftp.host,
    port: ftp.port,
    user: ftp.user,
    password: ftp.passwort,
    /* `secure: true` ist explizites FTPS: Die Verbindung wird im Klartext
       geöffnet und sofort per AUTH TLS verschlüsselt. Kann der Server das
       nicht, scheitert der Aufbau — er fällt NICHT auf Klartext zurück. */
    secure: true,
    secureOptions: { rejectUnauthorized: !ftp.tlsUngeprueft },
  })
  if (ftp.tlsUngeprueft) {
    console.log('  Hinweis: Das TLS-Zertifikat wird nicht geprüft (SICHERUNG_FTP_TLS_UNGEPRUEFT).')
  }
  await client.ensureDir(ftp.verzeichnis)
  return client
}

// ---- Nur die Verbindung prüfen --------------------------------------------

if (NUR_TEST) {
  if (!ftp.host || !ftp.user || !ftp.passwort) {
    console.error('Es fehlen SICHERUNG_FTP_HOST, SICHERUNG_FTP_USER oder SICHERUNG_FTP_PASSWORD.')
    process.exit(1)
  }
  console.log(`Verbindungstest: ${ftp.user}@${ftp.host}:${ftp.port}${ftp.verzeichnis}`)
  if (altNamenGesetzt) console.log('  (gelesen aus den alten SICHERUNG_SFTP_*-Variablen)')

  const client = new FtpClient(30_000)
  try {
    await client.access({
      host: ftp.host,
      port: ftp.port,
      user: ftp.user,
      password: ftp.passwort,
      secure: true,
      secureOptions: { rejectUnauthorized: !ftp.tlsUngeprueft },
    })
    console.log(`  Angemeldet. Startverzeichnis: ${await client.pwd()}`)

    await client.ensureDir(ftp.verzeichnis)
    console.log(`  Zielverzeichnis erreichbar: ${await client.pwd()}`)

    const liste = await client.list()
    console.log(`  Enthält ${liste.length} Einträge.`)
    for (const eintrag of liste.slice(0, 5)) console.log(`    ${eintrag.name}`)
    if (liste.length > 5) console.log(`    … und ${liste.length - 5} weitere`)

    console.log('\nDie Verbindung steht. Jetzt ohne SICHERUNG_TEST laufen lassen.')
    client.close()
    process.exit(0)
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : 'unbekannt'
    console.error(`\nFehlgeschlagen: ${text}`)
    client.close()
    process.exit(1)
  }
}

// ---- Vorbereitung ---------------------------------------------------------

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
let hochgeladen: boolean | null = null

if (!ftp.host || !ftp.user || !ftp.passwort) {
  console.log('\nZweiter Ablageort: nicht eingerichtet, die Sicherung liegt nur auf diesem Server.')
} else {
  let client: FtpClient | null = null
  try {
    console.log(`\nZweiter Ablageort: ${ftp.user}@${ftp.host}:${ftp.port}${ftp.verzeichnis}`)
    if (altNamenGesetzt) console.log('  (gelesen aus den alten SICHERUNG_SFTP_*-Variablen)')

    client = await verbinden()

    for (const datei of [dbZiel, tarZiel]) {
      if ((await groesse(datei)) === 0) continue
      const name = path.basename(datei)
      await client.uploadFrom(datei, name)
      console.log(`  Hochgeladen: ${name}`)
    }

    /* Dieselbe Regel wie lokal, sonst läuft der Webspace voll. Gelöscht wird
       nur, was dem eigenen Namensschema entspricht — was sonst in dem
       Verzeichnis liegt, bleibt unangetastet. */
    const dort = (await client.list()).map((e) => e.name)
    const dortStaende = [
      ...new Set(dort.map((name) => name.match(stempelMuster)?.[1]).filter(Boolean) as string[]),
    ].sort()
    for (const alt of dortStaende.slice(0, Math.max(0, dortStaende.length - BEHALTEN)).filter((s) => s !== stempel)) {
      for (const name of dort.filter((n) => stempelMuster.test(n) && n.includes(`-${alt}.`))) {
        await client.remove(name)
      }
      console.log(`  Entfernt: Stand ${alt}`)
    }

    hochgeladen = true
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : 'unbekannt'
    console.error(`\nDer zweite Ablageort war nicht erreichbar: ${text}`)
    hochgeladen = false
  } finally {
    client?.close()
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
