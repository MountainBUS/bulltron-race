/**
 * Rechnet die vorhandenen Bilder in der Mediathek auf WebP um.
 *
 * Im Container ausführen — erst der Probelauf, der nichts verändert:
 *   node_modules/.bin/payload run src/scripts/bilder-webp.ts
 *
 * Und wenn die Liste stimmt:
 *   BILDER_WEBP_AUSFUEHREN=1 node_modules/.bin/payload run src/scripts/bilder-webp.ts
 *
 * VORHER EINE SICHERUNG ZIEHEN. Das Skript ersetzt die Dateien im Volume;
 * Payload löscht dabei die alten. Rückgängig geht das nur über die Sicherung:
 *   node_modules/.bin/payload run src/scripts/sicherung.ts
 *
 * Wie es arbeitet: Jedes Bild wird aus dem Volume gelesen und unverändert
 * wieder an Payload übergeben. Payload lässt es dann durch dieselbe
 * Verarbeitung laufen wie einen frischen Upload — und weil in der
 * Media-Sammlung jetzt WebP als Format steht, entstehen dabei das Hauptbild
 * und alle drei abgeleiteten Größen als WebP. Dateiname, Dateigröße, Maße und
 * Formatangabe im Datensatz zieht Payload selbst nach.
 *
 * Die Adressen der Bilder ändern sich dadurch (.png wird zu .webp). Das ist
 * unkritisch, weil im Code nirgends eine Bildadresse fest steht: Alle Stellen
 * holen sie über `mediaUrl()` aus dem Datensatz.
 *
 * Mehrfach ausführbar: Was schon WebP ist, wird übersprungen.
 */
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config'

const AUSFUEHREN = ['1', 'true', 'ja'].includes(String(process.env.BILDER_WEBP_AUSFUEHREN ?? '').toLowerCase())
const VERZEICHNIS = process.env.MEDIA_DIR || 'public/media'

/* SVG ist keine Rastergrafik. Durch die Bildverarbeitung gedreht käme eine
   verpixelte Fassung heraus, die größer ist als das Original. */
const UEBERSPRINGEN = ['image/webp', 'image/svg+xml', 'image/gif']

const kb = (bytes: number): string => `${Math.round(bytes / 1024)} KB`

const payload = await getPayload({ config })

const alle = await payload.find({
  collection: 'media',
  limit: 1000,
  depth: 0,
  overrideAccess: true,
  sort: 'id',
})

console.log(`${alle.totalDocs} Bilder in der Mediathek.`)
if (!AUSFUEHREN) {
  console.log('PROBELAUF — es wird nichts verändert. Zum Ausführen BILDER_WEBP_AUSFUEHREN=1 setzen.\n')
} else {
  console.log('Es wird umgerechnet.\n')
}

let umgerechnet = 0
let uebersprungen = 0
let fehler = 0
let vorher = 0
let nachher = 0

for (const bild of alle.docs as Array<Record<string, any>>) {
  const name = String(bild.filename ?? '')
  const typ = String(bild.mimeType ?? '')

  if (!name) {
    console.log(`#${bild.id}: kein Dateiname hinterlegt, übersprungen.`)
    uebersprungen++
    continue
  }

  if (UEBERSPRINGEN.includes(typ)) {
    uebersprungen++
    continue
  }

  const quelle = path.resolve(VERZEICHNIS, name)

  let daten: Buffer
  let alteGroesse: number
  try {
    const info = await stat(quelle)
    alteGroesse = info.size
    daten = await readFile(quelle)
  } catch {
    console.error(`${name}: Datei liegt nicht unter ${VERZEICHNIS}, übersprungen.`)
    fehler++
    continue
  }

  vorher += alteGroesse

  if (!AUSFUEHREN) {
    console.log(`${name} (${typ}, ${kb(alteGroesse)}) würde umgerechnet`)
    umgerechnet++
    continue
  }

  try {
    /* `data: {}` lässt die Felder unberührt; die Arbeit macht `file`. Payload
       erkennt den neuen Upload, verarbeitet ihn nach den Vorgaben der Sammlung
       und räumt die alten Dateien weg. */
    const neu = (await payload.update({
      collection: 'media',
      id: bild.id,
      data: {},
      file: { data: daten, mimetype: typ, name, size: daten.length },
      overrideAccess: true,
    })) as Record<string, any>

    const neueGroesse = Number(neu.filesize ?? 0)
    nachher += neueGroesse
    umgerechnet++
    const ersparnis = alteGroesse > 0 ? Math.round(100 - (neueGroesse * 100) / alteGroesse) : 0
    console.log(`${name} → ${neu.filename}  ${kb(alteGroesse)} → ${kb(neueGroesse)}  (${ersparnis} % weniger)`)
  } catch (e) {
    console.error(`${name}: ${e instanceof Error ? e.message : 'unbekannt'}`)
    fehler++
  }
}

console.log('')
if (AUSFUEHREN) {
  console.log(`Umgerechnet: ${umgerechnet}, übersprungen: ${uebersprungen}, Fehler: ${fehler}`)
  /* Ohne Umrechnung wäre die Bilanz „0 KB → 0 KB (0 %)" — eine Zahl, die nichts
     aussagt und beim Nachlesen aussieht, als wäre etwas schiefgegangen. */
  if (umgerechnet > 0) {
    const ersparnis = vorher > 0 ? Math.round(100 - (nachher * 100) / vorher) : 0
    console.log(`Hauptbilder zusammen: ${kb(vorher)} → ${kb(nachher)} (${ersparnis} % weniger)`)
    console.log('Die abgeleiteten Größen sind darin nicht enthalten, sie schrumpfen im selben Verhältnis.')
  }
} else {
  console.log(`${umgerechnet} Bilder würden umgerechnet, ${uebersprungen} übersprungen, ${fehler} nicht lesbar.`)
  console.log(`Zusammen ${kb(vorher)} in den Hauptbildern.`)
}

/* Ein stiller Teilerfolg wäre schlimmer als ein Fehlschlag: Dann stünden
   halb umgerechnete Bilder in der Mediathek und niemand wüsste es. */
process.exit(fehler > 0 ? 1 : 0)
