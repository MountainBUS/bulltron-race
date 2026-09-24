/**
 * Erzeugt die Umrisse für die Händlerkarte als fertige SVG-Pfade.
 *
 *   npm pack world-atlas@2 && tar xzf world-atlas-2.0.2.tgz
 *   node scripts/build-karte.mjs pfad/zu/countries-50m.json
 *
 * Warum vorberechnet und nicht zur Laufzeit: Die Karte soll ohne fremden
 * Kachelserver auskommen. Damit entfällt ein Anbieter, ein Schlüssel, eine
 * monatliche Grenze und die Übertragung der Besucher-IP an einen Dritten — und
 * damit auch die Einwilligung, die das nach sich zöge. Übrig bleibt eine
 * statische Datei von wenigen Kilobyte, die genauso lange funktioniert wie die
 * Seite selbst.
 *
 * Datengrundlage: Natural Earth über das Paket `world-atlas` (ISC-Lizenz,
 * Natural Earth selbst ist gemeinfrei). Das Paket ist keine Abhängigkeit des
 * Projekts — dieses Skript läuft einmal von Hand, das Ergebnis wird
 * eingecheckt.
 *
 * Projektion: Mercator, auf den Ausschnitt Deutschland, Österreich, Schweiz
 * eingepasst. Dieselbe Formel steckt in `src/lib/karte.ts`, damit die Marker
 * auf denselben Punkten landen wie die Umrisse.
 */
import fs from 'fs'
import path from 'path'

const quelle = process.argv[2]
if (!quelle) {
  console.error('Aufruf: node scripts/build-karte.mjs <countries-50m.json>')
  process.exit(1)
}

/** Ländernummern nach ISO 3166-1. */
const LIEFERLAENDER = ['276', '040', '756'] // Deutschland, Österreich, Schweiz
const NACHBARN = ['250', '380', '203', '616', '528', '056', '208', '705', '703', '348', '442', '438']

/* --- TopoJSON entpacken ---------------------------------------------------
   Bewusst von Hand statt mit topojson-client: es sind dreißig Zeilen, und so
   bleibt das Projekt ohne zusätzliche Abhängigkeit für ein Skript, das einmal
   im Jahr läuft. */
const topo = JSON.parse(fs.readFileSync(quelle, 'utf8'))
const { scale, translate } = topo.transform

const bogen = (index) => {
  const umgedreht = index < 0
  const roh = topo.arcs[umgedreht ? ~index : index]
  let x = 0
  let y = 0
  const punkte = roh.map(([dx, dy]) => {
    x += dx
    y += dy
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]]
  })
  return umgedreht ? punkte.reverse() : punkte
}

const ringPunkte = (ring) => {
  const punkte = []
  for (const index of ring) {
    const teil = bogen(index)
    punkte.push(...(punkte.length ? teil.slice(1) : teil))
  }
  return punkte
}

const flaechen = (geometrie) => {
  if (geometrie.type === 'Polygon') return [geometrie.arcs]
  if (geometrie.type === 'MultiPolygon') return geometrie.arcs
  return []
}

/* --- Projektion ----------------------------------------------------------- */
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

const laender = topo.objects.countries.geometries
const gewaehlt = laender.filter((l) => [...LIEFERLAENDER, ...NACHBARN].includes(String(l.id)))
const kern = laender.filter((l) => LIEFERLAENDER.includes(String(l.id)))

/* Der Ausschnitt richtet sich nur nach den Lieferländern. Die Nachbarn laufen
   an den Rändern ins Bild und werden abgeschnitten — genau so ist es gewollt,
   sie sind Umgebung, kein Inhalt. */
let minLon = 180
let maxLon = -180
let minLat = 90
let maxLat = -90
for (const land of kern) {
  for (const flaeche of flaechen(land)) {
    for (const ring of flaeche) {
      for (const [lon, lat] of ringPunkte(ring)) {
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }
    }
  }
}

const RAND = 0.35 // Grad Luft rundherum
minLon -= RAND
maxLon += RAND
minLat -= RAND
maxLat += RAND

const BREITE = 1000
const skalaX = BREITE / (maxLon - minLon)
const yOben = mercY(maxLat)
const yUnten = mercY(minLat)
const skalaY = skalaX * (180 / Math.PI)
const HOEHE = Math.round((yOben - yUnten) * skalaY)

const x = (lon) => (lon - minLon) * skalaX
const y = (lat) => (yOben - mercY(lat)) * skalaY

/* Punkte ausdünnen: Bei 1000 Bildpunkten Breite ist alles unterhalb eines
   halben Pixels unsichtbar, kostet aber Bytes. Ohne diesen Schritt ist die
   Datei gut dreimal so groß, ohne dass man den Unterschied sieht. */
const ausduennen = (punkte, mindestabstand) => {
  const behalten = [punkte[0]]
  for (let i = 1; i < punkte.length - 1; i += 1) {
    const [lx, ly] = behalten[behalten.length - 1]
    const dx = x(punkte[i][0]) - x(lx)
    const dy = y(punkte[i][1]) - y(ly)
    if (dx * dx + dy * dy >= mindestabstand * mindestabstand) behalten.push(punkte[i])
  }
  behalten.push(punkte[punkte.length - 1])
  return behalten
}

const pfad = (land, mindestabstand) => {
  const teile = []
  for (const flaeche of flaechen(land)) {
    for (const ring of flaeche) {
      const punkte = ringPunkte(ring)
      if (punkte.length < 3) continue
      // Winzige Inseln weglassen: sie kosten Bytes und sind bei dieser Größe
      // ohnehin nur ein Pixelfleck.
      const lons = punkte.map((p) => p[0])
      const lats = punkte.map((p) => p[1])
      if (Math.max(...lons) - Math.min(...lons) < 0.12 && Math.max(...lats) - Math.min(...lats) < 0.12) continue
      const duenn = ausduennen(punkte, mindestabstand)
      if (duenn.length < 3) continue
      teile.push(
        'M' +
          duenn.map(([lon, lat]) => `${x(lon).toFixed(1)} ${y(lat).toFixed(1)}`).join('L') +
          'Z',
      )
    }
  }
  return teile.join('')
}

const ergebnis = {
  hinweis:
    'Erzeugt mit scripts/build-karte.mjs aus Natural Earth (world-atlas, gemeinfrei). Nicht von Hand ändern.',
  breite: BREITE,
  hoehe: HOEHE,
  ausschnitt: { minLon, maxLon, minLat, maxLat },
  lieferlaender: {},
  nachbarn: {},
}

for (const land of gewaehlt) {
  // Die Lieferländer tragen die Karte und bekommen mehr Stützpunkte; die
  // Nachbarn sind nur Umgebung und dürfen gröber sein.
  const kernland = LIEFERLAENDER.includes(String(land.id))
  const d = pfad(land, kernland ? 1.1 : 2.2)
  if (!d) continue
  const ziel = kernland ? ergebnis.lieferlaender : ergebnis.nachbarn
  ziel[land.properties.name] = d
}

const ziel = path.join(process.cwd(), 'public', 'daten', 'karte-dach.json')
fs.mkdirSync(path.dirname(ziel), { recursive: true })
fs.writeFileSync(ziel, JSON.stringify(ergebnis))

const groesse = (fs.statSync(ziel).size / 1024).toFixed(1)
console.log(`${ziel} geschrieben: ${BREITE} x ${HOEHE}, ${groesse} KB`)
console.log('Lieferländer:', Object.keys(ergebnis.lieferlaender).join(', '))
console.log('Nachbarn:', Object.keys(ergebnis.nachbarn).join(', '))
