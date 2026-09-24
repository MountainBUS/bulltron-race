/**
 * Projektion für die Händlerkarte.
 *
 * Dieselbe Rechnung wie in `scripts/build-karte.mjs`. Beides muss übereinstimmen,
 * sonst liegen die Marker neben den Umrissen — deshalb steht die Formel hier an
 * einer Stelle und wird nirgends nachgebaut.
 *
 * Mercator, weil die Umrisse so erzeugt wurden: Längengrade linear, Breitengrade
 * über den Logarithmus gestreckt. Auf dem Ausschnitt Deutschland, Österreich,
 * Schweiz ist die Verzerrung klein genug, dass niemand sie bemerkt.
 */

export type Kartendaten = {
  breite: number
  hoehe: number
  ausschnitt: { minLon: number; maxLon: number; minLat: number; maxLat: number }
  lieferlaender: Record<string, string>
  nachbarn: Record<string, string>
}

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

/** Rechnet Längen- und Breitengrad in Koordinaten des SVG-Ausschnitts um. */
export const projizieren = (karte: Kartendaten, lat: number, lng: number): { x: number; y: number } => {
  const { minLon, maxLon, maxLat } = karte.ausschnitt
  const skalaX = karte.breite / (maxLon - minLon)
  const skalaY = skalaX * (180 / Math.PI)
  return {
    x: (lng - minLon) * skalaX,
    y: (mercY(maxLat) - mercY(lat)) * skalaY,
  }
}

/** Liegt der Punkt überhaupt im dargestellten Ausschnitt? */
export const imAusschnitt = (karte: Kartendaten, lat: number, lng: number): boolean => {
  const { x, y } = projizieren(karte, lat, lng)
  return x >= 0 && x <= karte.breite && y >= 0 && y <= karte.hoehe
}
