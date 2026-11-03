/**
 * Überführt die Termine, die an den Teams hängen, in die Sammlung
 * Veranstaltungen — einmalig auf einer laufenden Instanz.
 *
 * Im Container ausführen — erst der Probelauf, der nichts verändert:
 *   node_modules/.bin/payload run src/scripts/veranstaltungen-aus-teamterminen.ts
 *
 * Und wenn die Liste stimmt:
 *   VERANSTALTUNGEN_AUSFUEHREN=1 node_modules/.bin/payload run src/scripts/veranstaltungen-aus-teamterminen.ts
 *
 * VORHER EINE SICHERUNG ZIEHEN. Das Skript legt nicht nur an, es räumt auch
 * auf: Jeder übernommene Termin wird anschließend beim Team entfernt. Täte es
 * das nicht, stünde derselbe Termin auf der Teamseite zweimal — einmal aus der
 * Veranstaltung, einmal aus dem alten Feld.
 *
 * WARUM EINE FESTE TABELLE UND KEIN AUTOMATISMUS: Die Teams schreiben in das
 * Feld „Veranstaltung" nicht nur den Namen der Veranstaltung, sondern auch,
 * was sie dort tun — „Oldtimer Trackday, Familientag — Radical SR3 als Race
 * Taxi". Das Erste gehört an die Veranstaltung, das Zweite an die Teilnahme.
 * Diese Trennung kann keine Regel zuverlässig treffen, deshalb steht sie
 * unten ausgeschrieben, Zeile für Zeile nachlesbar.
 *
 * Alles, was hier als Titel, Strecke oder Notiz steht, stammt aus dem, was das
 * jeweilige Team eingetragen hat. Zugefügt ist nur die Art der Veranstaltung
 * und, wo die Strecke außerhalb Deutschlands liegt, das Land.
 *
 * MEHRFACH AUSFÜHRBAR: Was über die Adresse schon existiert, wird
 * übersprungen; der Termin am Team wird dann trotzdem entfernt, damit der
 * zweite Lauf aufräumt, was der erste liegen gelassen hat.
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { slugify } from '../fields/slug'

const AUSFUEHREN = ['1', 'true', 'ja'].includes(String(process.env.VERANSTALTUNGEN_AUSFUEHREN ?? '').toLowerCase())

type Uebernahme = {
  /** Woher der Termin stammt — Teamadresse und Datum identifizieren ihn eindeutig. */
  teamSlug: string
  datum: string
  /** Was im Feld „Veranstaltung" des Teams stand, zum Wiederfinden. */
  quelle: string

  titel: string
  kind: 'rennen' | 'messe' | 'trackday' | 'sonstiges'
  venue?: string
  city?: string
  country?: string
  series?: string
  website?: string
  shortDescription?: string
  /** Gehört zur Teilnahme dieses Teams, nicht zur Veranstaltung. */
  note?: string
}

const UEBERNAHMEN: Uebernahme[] = [
  {
    teamSlug: 'mario-wittmann',
    datum: '2026-10-04',
    quelle: 'Grip',
    titel: 'Grip',
    kind: 'messe',
    venue: 'Lausitzring',
    website: 'https://dekra-lausitzring.de/grip-das-motorevent/',
    /* Im Feld „Strecke" stand „Am Lausitzring (Stand FOX Exhaustsystems)".
       Der Klammerzusatz beschreibt, wo das Team steht, nicht die Strecke. */
    note: 'Stand FOX Exhaustsystems',
  },
  {
    teamSlug: 'schmechel-race-tech',
    datum: '2026-10-11',
    quelle: 'European Timeattack und German Timeattack',
    /* Titel wörtlich übernommen, einschließlich der Schreibweise des Teams.
       Umbenennen geht im Backend in zehn Sekunden — raten wäre schlechter. */
    titel: 'European Timeattack und German Timeattack',
    kind: 'rennen',
    venue: 'Nürburgring',
  },
  {
    teamSlug: 'ehlich-motorsport',
    datum: '2026-10-25',
    quelle: 'Oldtimer Trackday, Familientag — Radical SR3 als Race Taxi',
    titel: 'Oldtimer Trackday, Familientag',
    kind: 'trackday',
    venue: 'Nürburgring',
    website: 'https://www.oldtimertrackdays.de/',
    note: 'Radical SR3 als Race Taxi',
  },
  {
    teamSlug: 'ehlich-motorsport',
    datum: '2026-11-07',
    quelle: 'Oldtimer Trackday — Radical SR3 als Race Taxi',
    titel: 'Oldtimer Trackday',
    kind: 'trackday',
    venue: 'Bilster Berg',
    website: 'https://www.oldtimertrackdays.de/',
    note: 'Radical SR3 als Race Taxi',
  },
  {
    teamSlug: 'r25performance',
    datum: '2026-11-15',
    quelle: 'Italian Time Attack Masters',
    titel: 'Italian Time Attack Masters',
    kind: 'rennen',
    series: 'Time Attack Masters',
    venue: 'Mugello',
    country: 'IT',
  },
  {
    teamSlug: '2-takt-monkeys',
    datum: '2027-05-02',
    quelle: '12hours of Racing Höchstädt (ob die Veranstaltung stattfindet, ist noch offen)',
    titel: '12hours of Racing Höchstädt',
    kind: 'rennen',
    venue: 'Höchstädt',
    /* Der Vorbehalt stand im Titel. Er gehört vor die Augen der Leser, nicht
       in die Überschrift — deshalb hier, in den Worten des Teams. */
    shortDescription: 'Ob die Veranstaltung stattfindet, ist noch offen.',
  },
  {
    teamSlug: '2-takt-monkeys',
    datum: '2027-09-05',
    quelle: 'Dreschfest Loitzschütz — Trabi-Rallye',
    titel: 'Dreschfest Loitzschütz — Trabi-Rallye',
    kind: 'sonstiges',
    venue: 'Loitzschütz',
    website: 'https://dreschfest-verein.loitzschuetz.de/dreschfest/trabi-rallye/',
  },
]

const payload = await getPayload({ config })

if (!AUSFUEHREN) {
  payload.logger.info('PROBELAUF — es wird nichts angelegt und nichts entfernt.')
  payload.logger.info('Zum Ausführen VERANSTALTUNGEN_AUSFUEHREN=1 setzen.')
} else {
  payload.logger.info('Veranstaltungen werden angelegt, die Termine an den Teams werden danach entfernt.')
}
payload.logger.info('')

/** Dasselbe Datum, unabhängig von der Uhrzeit, mit der es gespeichert wurde. */
const gleicherTag = (a?: string | null, b?: string) => {
  if (!a || !b) return false
  return String(a).slice(0, 10) === b
}

let angelegt = 0
let vorhanden = 0
let entfernt = 0
let fehler = 0

for (const u of UEBERNAHMEN) {
  const treffer = await payload.find({
    collection: 'teams',
    where: { slug: { equals: u.teamSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const team = treffer.docs[0] as Record<string, any> | undefined
  if (!team) {
    payload.logger.error(`${u.teamSlug}: Team nicht gefunden — „${u.titel}" übersprungen.`)
    fehler++
    continue
  }

  const slug = slugify(`${u.titel} ${u.datum}`)
  const schon = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  let eventId = schon.docs[0]?.id as number | undefined
  if (eventId) {
    payload.logger.info(`„${u.titel}" (${u.datum}) gibt es schon — nicht angelegt.`)
    vorhanden++
  } else {
    payload.logger.info(`„${u.titel}" (${u.datum}), ${u.venue ?? 'ohne Ort'} — Team ${team.teamName}${u.note ? ` — „${u.note}"` : ''}`)
    if (AUSFUEHREN) {
      try {
        const neu = await payload.create({
          collection: 'events',
          overrideAccess: true,
          data: {
            title: u.titel,
            slug,
            published: true,
            kind: u.kind,
            dateFrom: u.datum,
            series: u.series,
            venue: u.venue,
            city: u.city,
            country: u.country ?? 'DE',
            website: u.website,
            shortDescription: u.shortDescription,
            participants: [{ team: team.id, note: u.note }],
            internalNote: [
              `Übernommen am 03.11.2026 aus dem Terminfeld von ${team.teamName}.`,
              `Dort stand: „${u.quelle}".`,
              'Titel, Strecke und Hinweis stammen aus dieser Angabe; ergänzt wurden nur die Art der Veranstaltung und das Land.',
            ].join('\n'),
          } as never,
        })
        eventId = neu.id as number
        angelegt++
      } catch (e) {
        payload.logger.error(`  FEHLER beim Anlegen: ${e instanceof Error ? e.message : 'unbekannt'}`)
        fehler++
        continue
      }
    }
  }

  /* Den übernommenen Termin beim Team entfernen — sonst steht er auf der
     Teamseite doppelt. Verglichen wird über Datum und Text, damit nur genau
     dieser eine Eintrag verschwindet. */
  const alteTermine: any[] = Array.isArray(team.upcoming) ? team.upcoming : []
  const bleiben = alteTermine.filter((t) => !(gleicherTag(t?.date, u.datum) && String(t?.event ?? '') === u.quelle))
  if (bleiben.length === alteTermine.length) {
    payload.logger.info(`  Beim Team steht dieser Termin nicht (mehr) — nichts zu entfernen.`)
  } else {
    payload.logger.info(`  Termin bei ${team.teamName} wird entfernt (${alteTermine.length} → ${bleiben.length}).`)
    entfernt++
    if (AUSFUEHREN) {
      await payload.update({
        collection: 'teams',
        id: team.id,
        data: { upcoming: bleiben } as never,
        overrideAccess: true,
      })
    }
  }
}

/* Nachzählen statt annehmen: Wie viele Termine hängen hinterher noch an den
   Teams, und was steht jetzt in der Sammlung? */
payload.logger.info('')
const teams = await payload.find({ collection: 'teams', limit: 200, depth: 0, overrideAccess: true })
let restTermine = 0
for (const t of teams.docs as Record<string, any>[]) {
  const anzahl = Array.isArray(t.upcoming) ? t.upcoming.length : 0
  restTermine += anzahl
  if (anzahl > 0) payload.logger.warn(`${t.teamName}: ${anzahl} Termin(e) noch im alten Feld`)
}
payload.logger.info(`Termine in den alten Teamfeldern: ${restTermine}`)

const events = await payload.find({ collection: 'events', limit: 200, depth: 0, overrideAccess: true, sort: 'dateFrom' })
payload.logger.info(`Veranstaltungen im Bestand: ${events.totalDocs}`)
for (const e of events.docs as Record<string, any>[]) {
  payload.logger.info(`  ${String(e.dateFrom ?? '').slice(0, 10)}  ${e.title}  (${e.kind}, /veranstaltungen/${e.slug})`)
}

payload.logger.info('')
if (AUSFUEHREN) {
  payload.logger.info(`Angelegt: ${angelegt}, schon vorhanden: ${vorhanden}, bei den Teams entfernt: ${entfernt}, Fehler: ${fehler}`)
} else {
  payload.logger.info(`Probelauf beendet. ${UEBERNAHMEN.length - vorhanden - fehler} würden angelegt, ${entfernt} Termine würden bei den Teams entfernt.`)
}

process.exit(fehler > 0 ? 1 : 0)
