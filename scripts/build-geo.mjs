/**
 * Erzeugt die Offline-Geodaten für die Umkreissuche der Händlerseite.
 *
 * Ergebnis: public/daten/geo.json — drei Zeichenketten statt verschachteltem
 * JSON, das spart gegenüber einer Objektschreibweise gut die Hälfte der
 * Dateigröße. Satztrenner ist der Zeilenumbruch, Feldtrenner das Semikolon.
 * Koordinaten stehen als Hundertstelgrad ohne Komma (5332 = 53,32 Grad).
 *
 *   plz:      "21449;5332;1028"      deutsche Postleitzahl -> Koordinate
 *   plzLand:  "AT1010;4821;1637"      alle übrigen Länder, Schlüssel mit Kürzel
 *   orte:     "Radbruch;5332;1028;0"  Ortsname -> Koordinate, Land 0=DE 1=AT 2=CH 3=SE
 *
 * Damit läuft die Umkreissuche vollständig im Browser: kein Kartendienst wird
 * angefragt, keine Adresse und keine IP verlässt die Seite, und die Suche
 * funktioniert auch im statischen Export.
 *
 * Quelldaten (CC BY 4.0, geonames.org, aufbereitet von zauberware):
 *   https://github.com/zauberware/postal-codes-json-xml-csv
 * Die drei Länderarchive herunterladen, entpacken und die CSV-Dateien
 * nach scripts/geo-quelle/ legen:
 *   data/DE.zip -> zipcodes.de.csv
 *   data/AT.zip -> zipcodes.at.csv
 *   data/CH.zip -> zipcodes.ch.csv
 *   data/SE.zip -> zipcodes.se.csv
 * Danach:  node scripts/build-geo.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const quelle = path.join(process.cwd(), 'scripts/geo-quelle')
const LAENDER = [
  { code: 'DE', datei: 'zipcodes.de.csv', index: 0 },
  { code: 'AT', datei: 'zipcodes.at.csv', index: 1 },
  { code: 'CH', datei: 'zipcodes.ch.csv', index: 2 },
  /* Schweden seit 26.09.2026, wegen des Händlers in Älmhult. Schwedische
     Codes sind fünfstellig und werden mit Leerzeichen geschrieben („343 38").
     Das Leerzeichen fällt beim Schlüssel weg, und weil fünf Ziffern sonst mit
     einer deutschen Postleitzahl verwechselbar wären, steht das Länderkürzel
     davor. */
  { code: 'SE', datei: 'zipcodes.se.csv', index: 3 },
]

/* Großkunden-Postleitzahlen tragen einen Firmennamen statt eines Ortes.
   Die Koordinate ist brauchbar, der Name gehört nicht in die Ortsliste. */
const FIRMA = /GmbH|\bAG\b|\bKG\b|\bSE\b|mbH|& ?Co|Postfach|Großempf|Deutsche Post|Aktiengesellschaft|e\. ?V\./i

/* Hundertstelgrad: rund 1,1 km Auflösung. Für eine Umkreissuche, die in
   25-km-Stufen filtert, ist das reichlich genau. */
const hundertstel = (n) => Math.round(n * 100)

/** Einfacher CSV-Leser, der Felder in Anführungszeichen berücksichtigt. */
const zeileTeilen = (zeile) => {
  const felder = []
  let feld = ''
  let inAnfuehrung = false
  for (let i = 0; i < zeile.length; i += 1) {
    const z = zeile[i]
    if (z === '"') {
      if (inAnfuehrung && zeile[i + 1] === '"') {
        feld += '"'
        i += 1
      } else inAnfuehrung = !inAnfuehrung
    } else if (z === ',' && !inAnfuehrung) {
      felder.push(feld)
      feld = ''
    } else feld += z
  }
  felder.push(feld)
  return felder
}

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '')

const plz = {}
const plzLand = {}
const ortSammler = new Map()
const zaehler = {}

for (const land of LAENDER) {
  const pfad = path.join(quelle, land.datei)
  if (!fs.existsSync(pfad)) {
    console.error(`Fehlt: ${pfad} — siehe Kopf dieser Datei.`)
    process.exit(1)
  }

  const zeilen = fs.readFileSync(pfad, 'utf8').split('\n').slice(1).filter(Boolean)
  const plzSammler = new Map()

  for (const zeile of zeilen) {
    const f = zeileTeilen(zeile)
    if (f.length < 11) continue
    const [, code, ort] = f
    const lat = Number(f[9])
    const lng = Number(f[10])
    if (!code || !Number.isFinite(lat) || !Number.isFinite(lng)) continue

    /* Mehrere Zeilen je Postleitzahl: der Mittelwert trifft die Fläche besser
       als der erste Treffer. */
    const ziffern = code.replace(/\s+/g, '')
    const plzSchluessel = land.code === 'DE' ? ziffern : `${land.code}${ziffern}`
    const p = plzSammler.get(plzSchluessel) ?? { lat: 0, lng: 0, n: 0 }
    p.lat += lat
    p.lng += lng
    p.n += 1
    plzSammler.set(plzSchluessel, p)

    /* Österreich und die Schweiz führen jede Ortschaft einzeln auf. Für die
       Suche genügen die Gemeinden — das halbiert die Datei, ohne dass eine
       übliche Eingabe verloren geht. */
    const gemeinde = f[7]
    const ortNehmen =
      land.code === 'DE' || !gemeinde || norm(ort) === norm(gemeinde)

    /* Die schwedische Quelle schreibt den Ort klein („älmhult") und führt
       denselben Namen in der Spalte `province` in richtiger Schreibweise.
       Stimmen beide überein, wird die gepflegte Schreibweise genommen — in der
       Vorschlagsliste steht sonst Kleingeschriebenes. */
    const bezirk = f[5]
    const anzeige = bezirk && norm(bezirk) === norm(ort) ? bezirk : ort

    if (ort && ortNehmen && !FIRMA.test(ort)) {
      const ortSchluessel = `${land.index}:${norm(ort)}`
      const o = ortSammler.get(ortSchluessel) ?? { name: anzeige, land: land.index, lat: 0, lng: 0, n: 0 }
      o.lat += lat
      o.lng += lng
      o.n += 1
      ortSammler.set(ortSchluessel, o)
    }
  }

  for (const [schluessel, p] of plzSammler) {
    const wert = [hundertstel(p.lat / p.n), hundertstel(p.lng / p.n)]
    if (land.code === 'DE') plz[schluessel] = wert
    else plzLand[schluessel] = wert
  }
  zaehler[land.code] = plzSammler.size
}

/* Ortsliste: größere Orte zuerst, damit die Vorschlagsliste oben das Erwartete
   zeigt. Die Zahl der Postleitzahlen ist ein brauchbares Maß für die Größe. */
const orte = [...ortSammler.values()]
  .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'de'))
  .map((o) => [o.name.replace(/;/g, ' '), hundertstel(o.lat / o.n), hundertstel(o.lng / o.n), o.land])

const alsText = (eintraege) => eintraege.map((e) => e.join(';')).join('\n')

const daten = {
  plz: alsText(Object.entries(plz).map(([code, w]) => [code, w[0], w[1]])),
  plzLand: alsText(Object.entries(plzLand).map(([code, w]) => [code, w[0], w[1]])),
  orte: alsText(orte),
}

const ziel = path.join(process.cwd(), 'public/daten/geo.json')
fs.mkdirSync(path.dirname(ziel), { recursive: true })
fs.writeFileSync(ziel, JSON.stringify(daten))

console.log('Postleitzahlen DE:', zaehler.DE)
console.log('Postleitzahlen AT / CH / SE:', zaehler.AT, '/', zaehler.CH, '/', zaehler.SE)
console.log(
  'Orte gesamt:',
  orte.length,
  '(DE/AT/CH/SE:',
  [0, 1, 2, 3].map((i) => orte.filter((o) => o[3] === i).length).join('/') + ')',
)
console.log('Dateigröße:', Math.round(fs.statSync(ziel).size / 1024) + ' KB')
