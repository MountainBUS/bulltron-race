import fs from 'node:fs'
import path from 'node:path'
import { codeSuchen, geoAuswerten, type GeoDaten, type GeoRoh } from './geo'

let zwischenspeicher: GeoDaten | null = null

/** Lädt die Geotabelle einmalig in den Speicher des laufenden Prozesses. */
const laden = (): GeoDaten => {
  if (zwischenspeicher) return zwischenspeicher
  try {
    const datei = path.join(process.cwd(), 'public/daten/geo.json')
    zwischenspeicher = geoAuswerten(JSON.parse(fs.readFileSync(datei, 'utf8')) as GeoRoh)
  } catch {
    zwischenspeicher = geoAuswerten({ plz: '', plz4: '', orte: '' })
  }
  return zwischenspeicher
}

/**
 * Koordinaten zu einer Postleitzahl. Deutschland fünfstellig, Österreich und
 * die Schweiz vierstellig. Ohne Treffer null — dann bleibt der Eintrag ohne
 * Koordinate und erscheint nur in der Gesamtliste.
 */
export const koordinatenZuPlz = (
  plz?: string | null,
  land?: string | null,
): { lat: number; lng: number } | null => {
  if (!plz) return null
  const treffer = codeSuchen(laden(), String(plz), land ?? undefined)
  return treffer ? { lat: treffer.lat, lng: treffer.lng } : null
}
