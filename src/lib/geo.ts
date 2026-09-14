/**
 * Auswertung der Offline-Geotabelle aus public/daten/geo.json.
 *
 * Die Datei liegt in einem kompakten Textformat vor (siehe
 * scripts/build-geo.mjs). Dieses Modul läuft unverändert im Browser und auf
 * dem Server — es benutzt bewusst keine Node-Bausteine.
 */

export type GeoRoh = { plz: string; plz4?: string; orte: string }

export type Ort = { name: string; lat: number; lng: number; land: number }

export type GeoDaten = {
  /** Deutsche fünfstellige Postleitzahlen. */
  plz: Map<string, [number, number]>
  /** Vierstellige Codes, Schlüssel mit Länderkürzel: AT1010, CH8001. */
  plz4: Map<string, [number, number]>
  orte: Ort[]
}

export const LAENDER = ['DE', 'AT', 'CH'] as const

/** Hundertstelgrad aus der Datei zurück in Grad. */
const grad = (wert: string) => Number(wert) / 100

const codeTabelle = (text?: string): Map<string, [number, number]> => {
  const tabelle = new Map<string, [number, number]>()
  if (!text) return tabelle
  for (const zeile of text.split('\n')) {
    if (!zeile) continue
    const [code, lat, lng] = zeile.split(';')
    if (!code) continue
    tabelle.set(code, [grad(lat), grad(lng)])
  }
  return tabelle
}

export const geoAuswerten = (roh: GeoRoh): GeoDaten => {
  const orte: Ort[] = []
  for (const zeile of (roh.orte ?? '').split('\n')) {
    if (!zeile) continue
    const [name, lat, lng, land] = zeile.split(';')
    if (!name) continue
    orte.push({ name, lat: grad(lat), lng: grad(lng), land: Number(land) || 0 })
  }
  return { plz: codeTabelle(roh.plz), plz4: codeTabelle(roh.plz4), orte }
}

/** Postleitzahl in einem der drei Länder nachschlagen. */
export const codeSuchen = (
  daten: GeoDaten,
  code: string,
  land?: string,
): { lat: number; lng: number; land: string } | null => {
  const sauber = code.trim()
  if (/^\d{5}$/.test(sauber)) {
    const treffer = daten.plz.get(sauber)
    return treffer ? { lat: treffer[0], lng: treffer[1], land: 'DE' } : null
  }
  if (/^\d{4}$/.test(sauber)) {
    /* Vierstellige Codes gibt es in Österreich und in der Schweiz. Ist das Land
       bekannt, wird nur dort gesucht, sonst der Reihe nach. */
    const reihenfolge = land === 'CH' ? ['CH', 'AT'] : land === 'AT' ? ['AT'] : ['AT', 'CH']
    for (const l of reihenfolge) {
      const treffer = daten.plz4.get(`${l}${sauber}`)
      if (treffer) return { lat: treffer[0], lng: treffer[1], land: l }
    }
  }
  return null
}

/** Umlautfeste Schreibweise für den Vergleich von Ortsnamen. */
export const normalisieren = (s: string): string =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '')

/** Entfernung zweier Punkte auf der Erdkugel in Kilometern. */
export const entfernung = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const R = 6371
  const bogen = (g: number) => (g * Math.PI) / 180
  const dLat = bogen(bLat - aLat)
  const dLng = bogen(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(bogen(aLat)) * Math.cos(bogen(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
