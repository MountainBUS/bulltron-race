/**
 * Prüft eine Sicherung, ohne die laufenden Daten anzufassen.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/sicherung-pruefen.ts
 *   node_modules/.bin/payload run src/scripts/sicherung-pruefen.ts /data/sicherung/bulltron-2026-10-09-0300.db
 *
 * Ohne Angabe wird der jüngste Stand in SICHERUNG_DIR geprüft.
 *
 * Eine Sicherung, die nie geöffnet wurde, ist eine Vermutung. Dieses Skript
 * macht aus der Vermutung eine Aussage: Es öffnet die Kopie, lässt SQLite die
 * Datei durchrechnen und zählt nach, was drinsteht — Bestellungen, Rechnungen,
 * Produkte. Dazu das Archiv: lesbar, und sind die Rechnungs-PDFs enthalten.
 *
 * Es schreibt nichts und verändert nichts.
 */
import { createClient } from '@libsql/client'
import { execFile } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const ausfuehren = promisify(execFile)

const ZIEL = path.resolve(process.env.SICHERUNG_DIR || '/data/sicherung')
const ERWARTET = ['orders', 'invoices', 'products', 'coupons', 'teams', 'users']

const lesbar = (bytes: number): string =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

/* Entweder ein Pfad als Argument oder der jüngste Stand im Verzeichnis. Die
   Namen tragen den Zeitstempel, alphabetisch sortiert ist also chronologisch. */
const vorgabe = process.argv.slice(2).find((a) => a.endsWith('.db'))

let dbDatei: string
let stempel: string | null = null

if (vorgabe) {
  dbDatei = path.resolve(vorgabe)
  stempel = path.basename(dbDatei).match(/bulltron-(\d{4}-\d{2}-\d{2}-\d{4})\.db$/)?.[1] ?? null
} else {
  let dateien: string[]
  try {
    dateien = await readdir(ZIEL)
  } catch {
    console.error(`Kein Sicherungsverzeichnis unter ${ZIEL}.`)
    process.exit(1)
  }
  const staende = dateien.filter((n) => /^bulltron-\d{4}-\d{2}-\d{2}-\d{4}\.db$/.test(n)).sort()
  if (staende.length === 0) {
    console.error(`Keine Sicherung in ${ZIEL} gefunden.`)
    process.exit(1)
  }
  dbDatei = path.join(ZIEL, staende[staende.length - 1])
  stempel = staende[staende.length - 1].match(/bulltron-(.+)\.db$/)?.[1] ?? null
  console.log(`Jüngster Stand von ${staende.length}: ${staende[staende.length - 1]}`)
}

let fehler = 0
/** Aus der Datenbank gelesen; das Archiv wird daran gemessen. */
let rechnungenLautDatenbank = 0

// ---- Datenbank ------------------------------------------------------------

try {
  const groesse = (await stat(dbDatei)).size
  const client = createClient({ url: `file:${dbDatei}` })

  /* integrity_check liest jede Seite und jeden Index. Bei einer abgeschnittenen
     oder halb geschriebenen Datei kommt hier etwas anderes als "ok". */
  const pruefung = await client.execute('PRAGMA integrity_check')
  const befund = String(pruefung.rows[0]?.integrity_check ?? 'keine Antwort')

  const tabellen = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  const namen = tabellen.rows.map((r) => String(r.name))

  console.log(`\nDatenbank: ${path.basename(dbDatei)} (${lesbar(groesse)})`)
  console.log(`  Durchgerechnet: ${befund}`)
  console.log(`  Tabellen: ${namen.length}`)

  if (befund !== 'ok') fehler++

  const fehlend = ERWARTET.filter((t) => !namen.includes(t))
  if (fehlend.length > 0) {
    console.error(`  Es fehlen Tabellen: ${fehlend.join(', ')}`)
    fehler++
  }

  for (const tabelle of ERWARTET.filter((t) => namen.includes(t))) {
    const zahl = await client.execute(`SELECT COUNT(*) AS n FROM "${tabelle}"`)
    const anzahl = Number(zahl.rows[0]?.n ?? 0)
    if (tabelle === 'invoices') rechnungenLautDatenbank = anzahl
    console.log(`  ${tabelle.padEnd(10)} ${String(anzahl).padStart(5)}`)
  }

  /* Die jüngste Rechnungsnummer sagt am deutlichsten, wie aktuell der Stand
     ist — deutlicher als das Datum im Dateinamen. */
  if (namen.includes('invoices')) {
    const letzte = await client.execute(
      'SELECT invoice_number FROM invoices ORDER BY sequence DESC LIMIT 1',
    )
    const nummer = letzte.rows[0]?.invoice_number
    console.log(`  Letzte Rechnung: ${nummer ?? 'keine'}`)
  }

  client.close()
} catch (e) {
  console.error(`Die Datenbank ließ sich nicht öffnen: ${e instanceof Error ? e.message : 'unbekannt'}`)
  fehler++
}

// ---- Archiv ---------------------------------------------------------------

if (stempel) {
  const tarDatei = path.join(path.dirname(dbDatei), `dateien-${stempel}.tar.gz`)
  try {
    const groesse = (await stat(tarDatei)).size
    /* -t liest das Archiv vollständig durch und entpackt nichts. Ein
       beschädigtes Archiv fällt hier auf. */
    const { stdout } = await ausfuehren('tar', ['-tzf', tarDatei], { maxBuffer: 64 * 1024 * 1024 })
    const eintraege = stdout.split('\n').filter(Boolean)
    const rechnungen = eintraege.filter((n) => n.includes('/rechnungen/') && n.endsWith('.pdf'))

    console.log(`\nArchiv: ${path.basename(tarDatei)} (${lesbar(groesse)})`)
    console.log(`  Einträge: ${eintraege.length}`)
    console.log(`  Rechnungs-PDFs: ${rechnungen.length}`)

    /* Gemessen wird am Datenbankstand, nicht an Null: Vor der ersten Bestellung
       gibt es zu Recht keine PDFs. Fehlen sie, OBWOHL Rechnungen erfasst sind,
       liegt INVOICE_DIR außerhalb von MEDIA_DIR — dann sichern wir seit jeher
       die Daten ohne die Belege. */
    if (rechnungenLautDatenbank > 0 && rechnungen.length < rechnungenLautDatenbank) {
      console.error(
        `  Die Datenbank kennt ${rechnungenLautDatenbank} Rechnungen, im Archiv liegen ${rechnungen.length} PDFs.` +
          ' Zeigt INVOICE_DIR aus MEDIA_DIR heraus?',
      )
      fehler++
    }
  } catch (e) {
    console.error(`\nDas Archiv ließ sich nicht lesen: ${e instanceof Error ? e.message : 'unbekannt'}`)
    fehler++
  }
} else {
  console.log('\nKein Zeitstempel im Dateinamen — das zugehörige Archiv wurde nicht geprüft.')
}

console.log('')
if (fehler > 0) {
  console.error(`Nicht in Ordnung: ${fehler} Beanstandung(en).`)
  process.exit(1)
}
console.log('Die Sicherung ist lesbar und vollständig.')
process.exit(0)
