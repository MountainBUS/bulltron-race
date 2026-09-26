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
 * Projektion: Mercator, auf den unten festgelegten Ausschnitt eingepasst.
 * Dieselbe Formel steckt in `src/lib/karte.ts`, damit die Marker auf denselben
 * Punkten landen wie die Umrisse.
 */
import fs from 'fs'
import path from 'path'

const quelle = process.argv[2]
if (!quelle) {
  console.error('Aufruf: node scripts/build-karte.mjs <countries-50m.json>')
  process.exit(1)
}

/* --- Ausschnitt und Länder ------------------------------------------------
   Der Ausschnitt steht fest und richtet sich nicht mehr nach den Kernländern:
   Mit Schweden dabei wäre eine eingepasste Karte 1000 x 2409 — ein schmaler
   hoher Streifen, in dem Deutschland winzig ist. Nach Westen erweitert kommt
   sie auf 1000 x 1291 und damit fast auf die Proportion der alten DACH-Karte
   zurück. Die zusätzliche Fläche im Westen kostet nichts: Sie ist Umgebung,
   und die Umgebungsländer sind grob gerastert.

   Kernländer sind die Länder, in denen Partner sitzen. Kommt ein Partner in
   einem neuen Land dazu, gehört dessen Nummer hier hinein und die Datei muss
   neu erzeugt werden. */
const AUSSCHNITT = { minLon: -5, maxLon: 31, minLat: 45.5, maxLat: 69.4 }

/** Ländernummern nach ISO 3166-1 numerisch. */
const KERN = [
  '276', // Deutschland
  '040', // Österreich
  '756', // Schweiz
  '752', // Schweden
]

const UMGEBUNG = [
  '250', '826', '372', '528', '056', '442', '724', '620', // FR, GB, IE, NL, BE, LU, ES, PT
  '380', '203', '616', '348', '703', '705', '191', '100', // IT, CZ, PL, HU, SK, SI, HR, BG
  '642', '208', '578', '246', '233', '428', '440', '112', // RO, DK, NO, FI, EE, LV, LT, BY
  '804', '643', '807', '688', '070', '008', '499', '275', // UA, RU, MK, RS, BA, AL, ME, PS
]

const BREITE = 1000

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

/* --- Datumsgrenze ---------------------------------------------------------
   Russlands Umriss läuft über die Datumsgrenze. Zwischen einem Punkt bei
   +179 und dem nächsten bei -179 liegt in den Zahlen ein Sprung von 358 Grad,
   und gezeichnet wird daraus eine Gerade quer über die ganze Karte — im
   fertigen Bild ein helles Rechteck über halb Skandinavien. Gemessen: Der
   Pfad reichte von x = -4861 bis x = 5136 bei 1000 Bildpunkten Breite.

   Behoben, indem der Ring vorher auf einen durchgehenden Zahlenbereich
   gebracht wird: Läuft er über mehr als 180 Grad, bekommen die negativen
   Längengrade 360 dazu. Dann ist er monoton, und das Beschneiden darunter
   greift sauber. */
const entwirren = (punkte) => {
  const lons = punkte.map((p) => p[0])
  if (Math.max(...lons) - Math.min(...lons) <= 180) return punkte
  return punkte.map(([lon, lat]) => [lon < 0 ? lon + 360 : lon, lat])
}

/* --- Beschneiden ----------------------------------------------------------
   Sutherland-Hodgman gegen das Rechteck des Ausschnitts, mit etwas Luft.
   Vorher wurden Länder ganz gezeichnet und der Überstand im Browser per
   `overflow: hidden` abgeschnitten. Das sah gleich aus, kostete aber Bytes für
   Umrisse, die nie jemand sieht — und half gegen die Datumsgrenze nicht.

   Im Längen- und Breitengrad beschnitten, nicht in Bildpunkten: Die Mercator-
   Projektion ist in beiden Achsen monoton, ein achsenparalleles Rechteck
   bleibt also ein Rechteck, und die Zahlen sind hier lesbarer. */
const LUFT = 2

const beschneiden = (punkte, kante, drin, schnitt) => {
  if (punkte.length === 0) return punkte
  const ergebnis = []
  for (let i = 0; i < punkte.length; i += 1) {
    const a = punkte[i]
    const b = punkte[(i + 1) % punkte.length]
    const aDrin = drin(a)
    const bDrin = drin(b)
    if (aDrin) ergebnis.push(a)
    if (aDrin !== bDrin) ergebnis.push(schnitt(a, b, kante))
  }
  return ergebnis
}

const rechteckBeschneiden = (punkte, { minLon, maxLon, minLat, maxLat }) => {
  const l = minLon - LUFT
  const r = maxLon + LUFT
  const u = minLat - LUFT
  const o = maxLat + LUFT
  const teilX = (a, b, wert) => [wert, a[1] + ((b[1] - a[1]) * (wert - a[0])) / (b[0] - a[0])]
  const teilY = (a, b, wert) => [a[0] + ((b[0] - a[0]) * (wert - a[1])) / (b[1] - a[1]), wert]
  let p = punkte
  p = beschneiden(p, l, (q) => q[0] >= l, teilX)
  p = beschneiden(p, r, (q) => q[0] <= r, teilX)
  p = beschneiden(p, u, (q) => q[1] >= u, teilY)
  p = beschneiden(p, o, (q) => q[1] <= o, teilY)
  return p
}

/* --- Projektion ----------------------------------------------------------- */
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

const { minLon, maxLon, minLat, maxLat } = AUSSCHNITT
const skalaX = BREITE / (maxLon - minLon)
const yOben = mercY(maxLat)
const skalaY = skalaX * (180 / Math.PI)
const HOEHE = Math.round((yOben - mercY(minLat)) * skalaY)

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
      const roh = rechteckBeschneiden(entwirren(ringPunkte(ring)), AUSSCHNITT)
      if (roh.length < 3) continue
      // Winzige Inseln weglassen: sie kosten Bytes und sind bei dieser Größe
      // ohnehin nur ein Pixelfleck.
      const lons = roh.map((p) => p[0])
      const lats = roh.map((p) => p[1])
      if (Math.max(...lons) - Math.min(...lons) < 0.12 && Math.max(...lats) - Math.min(...lats) < 0.12) continue
      const duenn = ausduennen(roh, mindestabstand)
      if (duenn.length < 3) continue
      teile.push('M' + duenn.map(([lon, lat]) => `${x(lon).toFixed(1)} ${y(lat).toFixed(1)}`).join('L') + 'Z')
    }
  }
  return teile.join('')
}

const ergebnis = {
  hinweis:
    'Erzeugt mit scripts/build-karte.mjs aus Natural Earth (world-atlas, gemeinfrei). Nicht von Hand ändern.',
  breite: BREITE,
  hoehe: HOEHE,
  ausschnitt: AUSSCHNITT,
  kernlaender: {},
  umgebung: {},
}

const laender = topo.objects.countries.geometries
for (const land of laender) {
  const id = String(land.id)
  // Die Kernländer tragen die Karte und bekommen mehr Stützpunkte; die
  // Umgebung ist nur Zusammenhang und darf gröber sein.
  const kern = KERN.includes(id)
  if (!kern && !UMGEBUNG.includes(id)) continue
  const d = pfad(land, kern ? 1.1 : 2.2)
  if (!d) continue
  const ziel = kern ? ergebnis.kernlaender : ergebnis.umgebung
  ziel[land.properties.name] = d
}

const ziel = path.join(process.cwd(), 'public', 'daten', 'karte-dach.json')
fs.mkdirSync(path.dirname(ziel), { recursive: true })
fs.writeFileSync(ziel, JSON.stringify(ergebnis))

const groesse = (fs.statSync(ziel).size / 1024).toFixed(1)
console.log(`${ziel} geschrieben: ${BREITE} x ${HOEHE}, ${groesse} KB`)
console.log('Kernländer:', Object.keys(ergebnis.kernlaender).join(', '))
console.log('Umgebung:  ', Object.keys(ergebnis.umgebung).join(', '))
