import type { Event } from '../payload-types'

/**
 * Hilfen für die Veranstaltungsseiten.
 *
 * Eine Veranstaltung hat ein Anfangs- und ein optionales Enddatum. Fast alles
 * hier dreht sich um die Frage, was „vorbei" heißt und wie ein Zeitraum lesbar
 * wird, ohne die Jahreszahl dreimal zu wiederholen.
 */

export const ART_LABEL: Record<string, string> = {
  rennen: 'Rennen',
  messe: 'Messe',
  trackday: 'Trackday',
  sonstiges: 'Veranstaltung',
}

export const LAND_LABEL: Record<string, string> = {
  DE: 'Deutschland',
  AT: 'Österreich',
  CH: 'Schweiz',
  NL: 'Niederlande',
  IT: 'Italien',
  BE: 'Belgien',
  FR: 'Frankreich',
  ES: 'Spanien',
  XX: '',
}

/* Die Daten stehen als reine Tagesangaben in der Datenbank, abgelegt als
   Mitternacht UTC. Ohne feste Zeitzone würde ein Server westlich von
   Greenwich daraus den Vortag machen — aus dem 15.11. würde der 14.11. */
const tag = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const tagMonat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
const nurTag = new Intl.DateTimeFormat('de-DE', { day: '2-digit', timeZone: 'UTC' })
const monatJahr = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' })

const alsDatum = (wert?: string | null): Date | null => {
  if (!wert) return null
  const d = new Date(wert)
  return Number.isNaN(d.getTime()) ? null : d
}

export const datum = (wert?: string | null): string => {
  const d = alsDatum(wert)
  return d ? tag.format(d) : ''
}

/** Der letzte Tag einer Veranstaltung — das Ende, sonst der Beginn. */
export const letzterTag = (v: Event): Date | null => alsDatum(v.dateTo) ?? alsDatum(v.dateFrom)

/**
 * Vorbei ist eine Veranstaltung erst nach ihrem letzten Tag.
 *
 * Der Vergleich läuft gegen Mitternacht UTC des heutigen Tages — genau wie
 * die Daten gespeichert sind. Ein Rennen am selben Tag bleibt dadurch den
 * ganzen Tag unter „kommende Termine" stehen.
 */
export const istVorbei = (v: Event): boolean => {
  const ende = letzterTag(v)
  if (!ende) return false
  const heute = new Date()
  const heuteUtc = Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth(), heute.getUTCDate())
  return ende.getTime() < heuteUtc
}

/**
 * Der Zeitraum in einer Zeile, ohne Wiederholungen:
 *   ein Tag            → „15.11.2026"
 *   gleicher Monat     → „05. – 06.12.2026"
 *   gleiches Jahr      → „28.11. – 02.12.2026"
 *   über den Jahreswechsel → „30.12.2026 – 02.01.2027"
 */
export const zeitraum = (v: Event): string => {
  const von = alsDatum(v.dateFrom)
  if (!von) return ''
  const bis = alsDatum(v.dateTo)
  if (!bis || bis.getTime() === von.getTime()) return tag.format(von)

  if (von.getUTCFullYear() !== bis.getUTCFullYear()) return `${tag.format(von)} – ${tag.format(bis)}`
  /* `tagMonat` liefert im Deutschen schon einen Punkt am Ende („28.11."),
     `nurTag` dagegen nicht („28") — deshalb einmal mit und einmal ohne. */
  if (von.getUTCMonth() !== bis.getUTCMonth()) return `${tagMonat.format(von)} – ${tag.format(bis)}`
  return `${nurTag.format(von)}. – ${tag.format(bis)}`
}

/** Überschrift einer Monatsgruppe, etwa „November 2026". */
export const monatsTitel = (v: Event): string => {
  const d = alsDatum(v.dateFrom)
  return d ? monatJahr.format(d) : ''
}

/** Ort in einer Zeile: Strecke, Ort, Land — ohne doppelte Trenner bei Lücken. */
export const ortZeile = (v: Event): string =>
  [v.venue, v.city, v.country && v.country !== 'DE' ? LAND_LABEL[v.country] : null]
    .filter((t) => typeof t === 'string' && t.trim().length > 0)
    .join(' · ')

/** Kommende zuerst, aufsteigend; danach die vergangenen, neueste zuerst. */
export const aufgeteilt = (events: Event[]): { kommend: Event[]; vergangen: Event[] } => {
  const kommend: Event[] = []
  const vergangen: Event[] = []
  for (const v of events) (istVorbei(v) ? vergangen : kommend).push(v)

  kommend.sort((a, b) => {
    /* Hervorgehobene zuerst, sonst nach Datum. */
    if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1
    return new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime()
  })
  vergangen.sort((a, b) => new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime())
  return { kommend, vergangen }
}

/** Kommende Veranstaltungen nach Monat gruppiert, in der Reihenfolge der Liste. */
export const nachMonat = (events: Event[]): Array<{ titel: string; eintraege: Event[] }> => {
  const gruppen: Array<{ titel: string; eintraege: Event[] }> = []
  for (const v of events) {
    const titel = monatsTitel(v)
    const letzte = gruppen[gruppen.length - 1]
    if (letzte && letzte.titel === titel) letzte.eintraege.push(v)
    else gruppen.push({ titel, eintraege: [v] })
  }
  return gruppen
}

/** Die Teams einer Veranstaltung, aufgelöst und ohne kaputte Einträge. */
export const teilnehmer = (v: Event): Array<{ team: any; note?: string | null; result?: string | null }> =>
  (v.participants ?? [])
    .filter((p: any) => p?.team && typeof p.team === 'object')
    .map((p: any) => ({ team: p.team, note: p.note, result: p.result }))

/**
 * Der nächste kommende Termin je Team, aus den Veranstaltungen.
 *
 * Wird auf der Teamübersicht gebraucht: Dort steht an jeder Karte, wann das
 * Team das nächste Mal fährt. Die Veranstaltungen kennen die Teams, die Teams
 * aber nicht ihre Veranstaltungen — deshalb hier einmal umgedreht, statt je
 * Karte eine eigene Abfrage zu stellen.
 */
export const naechsteJeTeam = (events: Event[]): Map<string, Event> => {
  const karte = new Map<string, Event>()
  const kommend = events
    .filter((v) => !istVorbei(v) && !v.canceled)
    .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
  for (const v of kommend) {
    for (const { team } of teilnehmer(v)) {
      const schluessel = String(team?.id ?? team)
      if (!karte.has(schluessel)) karte.set(schluessel, v)
    }
  }
  return karte
}

/** Die kommenden Veranstaltungen eines Teams, aufsteigend nach Datum. */
export const kommendeFuerTeam = (events: Event[]): Event[] =>
  events.filter((v) => !istVorbei(v)).sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
