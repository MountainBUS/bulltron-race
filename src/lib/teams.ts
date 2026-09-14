/**
 * Hilfen für die Teamseiten.
 *
 * Die Fragebögen kommen unterschiedlich vollständig zurück. Grundregel für das
 * Frontend: Was leer ist, erzeugt keine Überschrift, keine leere Zeile und
 * keinen leeren Abschnitt. Diese Funktionen entscheiden das an einer Stelle,
 * damit die Seiten nicht an zwanzig Stellen dasselbe prüfen.
 */

/** Ein Wert gilt als vorhanden, wenn er kein leerer String und keine leere Liste ist. */
export const gefuellt = (wert: unknown): boolean => {
  if (wert === null || wert === undefined) return false
  if (typeof wert === 'string') return wert.trim().length > 0
  if (Array.isArray(wert)) return wert.length > 0
  if (typeof wert === 'number') return true
  if (typeof wert === 'boolean') return wert
  return true
}

/** Liste ohne leere Einträge; gibt null zurück, wenn nichts übrig bleibt. */
export const listeOderNull = <T>(wert: T[] | null | undefined): T[] | null => {
  if (!Array.isArray(wert)) return null
  const gefiltert = wert.filter((eintrag) => eintrag !== null && eintrag !== undefined)
  return gefiltert.length > 0 ? gefiltert : null
}

/** Baut aus mehreren Teilen eine Zeile, ohne doppelte Trenner bei Lücken. */
export const zusammensetzen = (teile: Array<string | null | undefined>, trenner = ' · '): string =>
  teile.filter((teil) => typeof teil === 'string' && teil.trim().length > 0).join(trenner)

const datumsFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const teamDatum = (wert?: string | null): string => {
  if (!wert) return ''
  const d = new Date(wert)
  return Number.isNaN(d.getTime()) ? '' : datumsFormat.format(d)
}

/**
 * Termine, die noch bevorstehen — nach Datum sortiert.
 *
 * Der Vergleich läuft gegen Mitternacht des heutigen Tages, damit ein Rennen
 * am selben Tag nicht schon am Morgen aus der Liste fällt.
 */
export const kommendeTermine = <T extends { date?: string | null }>(termine: T[] | null | undefined): T[] => {
  if (!Array.isArray(termine)) return []
  const heute = new Date()
  heute.setHours(0, 0, 0, 0)
  return termine
    .filter((termin) => {
      if (!termin?.date) return false
      const d = new Date(termin.date)
      return !Number.isNaN(d.getTime()) && d.getTime() >= heute.getTime()
    })
    .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())
}

/** Ergebnisse absteigend nach Datum; Einträge ohne Datum bleiben hinten in ihrer Reihenfolge. */
export const ergebnisseSortiert = <T extends { date?: string | null }>(werte: T[] | null | undefined): T[] => {
  if (!Array.isArray(werte)) return []
  const mitDatum = werte.filter((w) => w?.date)
  const ohneDatum = werte.filter((w) => !w?.date)
  mitDatum.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
  return [...mitDatum, ...ohneDatum]
}

/** Bezeichnung eines Fahrzeugs aus Hersteller, Modell und Baujahr. */
export const fahrzeugTitel = (fahrzeug: {
  manufacturer?: string | null
  model?: string | null
  year?: string | null
}): string => {
  const name = zusammensetzen([fahrzeug.manufacturer, fahrzeug.model], ' ')
  if (!name) return fahrzeug.year ? `Fahrzeug, Baujahr ${fahrzeug.year}` : 'Fahrzeug'
  return fahrzeug.year ? `${name} (${fahrzeug.year})` : name
}
