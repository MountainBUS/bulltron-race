/**
 * Legt das Rennteam AHG Racing an — auf einer bereits laufenden Instanz,
 * ohne den Seed erneut auszuführen.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/team-ahg-racing.ts
 *
 * MEHRFACH AUSFÜHRBAR: Gibt es den Eintrag schon, passiert nichts. So
 * überschreibt ein zweiter Lauf keine redaktionelle Arbeit.
 *
 * QUELLE: die Antwort aus dem Formular „Unsere Rennteams" vom 03.11.2026
 * (Eugen Tomm). Bilder hat das Team per E-Mail angekündigt, sie liegen bei der
 * Anlage noch nicht vor.
 *
 * STEHT AUF NICHT VERÖFFENTLICHT, aus drei Gründen, alle in der internen
 * Notiz: keine Bilder, kein Batteriemodell, und die Renntermine im Bogen
 * liegen alle in der Vergangenheit, obwohl die kommende Saison gemeint ist.
 * Termine werden deshalb keine angelegt.
 *
 * AM TEXT GEÄNDERT habe ich nur offensichtliche Schreibfehler, einzeln in der
 * internen Notiz aufgeführt. Inhaltlich steht nichts im Eintrag, was nicht im
 * Bogen steht.
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { doc, p } from '../seed/lexical'

const payload = await getPayload({ config })

const vorhanden = await payload.find({
  collection: 'teams',
  where: { teamName: { equals: 'AHG Racing' } },
  limit: 1,
  overrideAccess: true,
})
if (vorhanden.docs.length > 0) {
  payload.logger.info('AHG Racing steht bereits im Backend — es wird nichts geändert.')
  process.exit(0)
}

/* Hinten anstellen: eins hinter dem höchsten vorhandenen Wert. */
const letztes = await payload.find({ collection: 'teams', sort: '-sortOrder', limit: 1, depth: 0, overrideAccess: true })
const sortOrder = ((letztes.docs[0]?.sortOrder as number | undefined) ?? 0) + 1

const team = await payload.create({
  collection: 'teams',
  overrideAccess: true,
  data: {
    teamName: 'AHG Racing',
    /* Absichtlich aus — siehe Kopf der Datei und interne Notiz. */
    published: false,
    sortOrder,

    drivers: [{ name: 'Eugen Tomm' }],
    location: 'Morsbach',
    series: 'GTAM Club, 4WD-Klasse – ab der kommenden Saison nur noch 318ti Cup',

    /* Der zweite Absatz stand im Bogen im Feld „Kommende Renntermine". Er
       beschreibt, wie es weitergeht, und gehört deshalb zur Vorstellung. */
    intro: doc([
      p(
        'Eugen Tomm, 40 Jahre alt. Wohne nicht weit von der Nordschleife. Anfangs durch Touristenfahrten immer wieder die Nordschleife gefahren und so kam ich zum Motorsport.',
      ),
      p(
        'Ich werde kommende Saison komplett für Team Rönforth Racing beim 318ti Cup teilnehmen, da mir der Rennsport um Positionskämpfe besser liegt.',
      ),
    ]),

    /* Im Formular angekreuzt: „Ja, mit Name und E-Mail-Adresse". */
    contactName: 'Eugen Tomm',
    contactEmail: 'eugen.tomm@freenet.de',
    contactPublic: true,

    /* Eine Webseite hat das Team nicht angegeben. Bei den Instagram-Adressen
       sind die Weitergabe-Kennungen aus der App (?rpxt=, ?psln=) entfernt.
       Im Feld „Instagram" für das Team steht der Kanal von Rönforth Racing,
       dem Team, für das Eugen Tomm ab der kommenden Saison fährt — deshalb
       ist er so beschriftet und nicht als Kanal von AHG Racing. */
    social: [
      { label: 'Instagram (Eugen Tomm)', url: 'https://www.instagram.com/tommracing' },
      { label: 'Instagram (Rönforth Racing)', url: 'https://www.instagram.com/roenforth_racing' },
      { label: 'DMV BMW 318ti Cup', url: 'https://www.dmv-bmw318ticup.de/' },
    ],

    vehicles: [
      {
        manufacturer: 'Mitsubishi',
        model: 'Lancer Evo 7',
        year: '2001',
        /* „4G62" steht so im Bogen. Der Evo 7 hat ab Werk den 4G63 — nicht
           geändert, weil es ein Umbau sein kann. Steht in der Notiz. */
        engine: '4G62 / 2 l Turbo / 440 PS',
        modifications:
          'Der Motor wurde komplett ausschließlich mit Original-Mitsubishi-Teilen vor 2 Jahren revidiert. Kein Schmiedemotor.',
        /* KEINE BATTERIE: Das Feld ist im Bogen leer. Nicht auf Verdacht füllen. */
        since: '2026',
        reason:
          'Da alle Fahrer, die mit der Batterie fahren, total begeistert waren und man nie was Negatives gehört hat.',
        experience: 'Alles top.',
      },
      {
        manufacturer: 'BMW',
        model: '328i',
        year: '1995',
        engine: 'M52B28 / 2,8 l / 210 PS',
        modifications: 'Alles von Knoop Motorsport.',
        /* KEINE BATTERIE: auch hier leer im Bogen. */
        since: '2026',
        reason: 'Da alle davon total begeistert waren.',
      },
    ],

    /* Ohne Datum: Der Bogen nennt keins, und raten wird hier nichts. Das
       Datumsfeld ist bei Ergebnissen nicht Pflicht. */
    results: [
      { event: 'GTAM, Hockenheimring', placement: 'Platz 1' },
      { event: 'GTAM, Salzburgring', placement: 'Platz 1' },
      { event: 'ETAM, Nürburgring', placement: 'Platz 1' },
    ],

    pastAchievements: [
      { year: '2023', title: 'Vizemeister GTAM' },
      { year: '2024', title: 'Deutscher Meister GTAM' },
      { year: '2025', title: 'Deutscher Meister GTAM' },
      { year: '2026', title: 'Deutscher Meister GTAM' },
      { year: '2026', title: 'Europameister ETAM' },
      { year: '2026', title: 'Zweimal Top 20 im 318ti Cup' },
    ],

    internalNote: [
      'Angelegt am 05.11.2026 aus dem Formular „Unsere Rennteams", Eingang 03.11.2026.',
      '',
      'STEHT AUF NICHT VERÖFFENTLICHT. Vor dem Freischalten zu klären:',
      '',
      '1. BILDER FEHLEN. Laut Formular kommen sie per E-Mail an info@bulltron-race.de. Auf allen Bildern ist laut Team Eugen Tomm selbst der Fahrer. Bildnachweis laut Formular: „Bilder wurden teilweise von Vivenlizeran gemacht" — welche, und von wem die übrigen sind, ist offen.',
      '',
      '2. KEIN BATTERIEMODELL. Bei beiden Fahrzeugen ist das Feld leer, „seit wann" ist mit 2026 beantwortet. Die Seite verlinkt damit auf kein Produkt.',
      '',
      '3. TERMINE NICHT ANGELEGT. Im Bogen stehen, eingeleitet mit „kommende Saison" (318ti Cup):',
      '   02.04.2026 Hockenheimring',
      '   23.04.2026 Nürburgring',
      '   02.04.2026 Zolder',
      '   03.09.2026 Lausitzring',
      '   22.10.2026 Hockenheimring',
      '   Alle liegen bei Eingang des Formulars in der Vergangenheit, vermutlich ist 2027 gemeint. Zwei Termine fallen außerdem auf denselben Tag (02.04.). Bitte beim Team bestätigen lassen und dann als Veranstaltungen anlegen. Link zur Serie: https://www.dmv-bmw318ticup.de/',
      '',
      'Weiter offen:',
      '- Die drei Siege der Saison 2026 (Hockenheimring, Salzburgring, Nürburgring) stehen ohne Datum im Bogen und deshalb ohne Datum im Eintrag.',
      '- Teamname: Im Feld „Instagram" für das Team steht der Kanal von Rönforth Racing. Der Eintrag heißt so, wie im Formular angegeben: AHG Racing. Falls das Team ab 2027 unter Rönforth Racing laufen soll, hier umbenennen.',
      '- Motor des Evo 7: im Bogen „4G62". Ab Werk hat der Evo 7 den 4G63. Nicht geändert, weil es auch ein Umbau sein kann — bitte nachfragen.',
      '- Kein Teamlogo, keine Webseite angegeben.',
      '',
      'Am Text geändert, sonst nichts:',
      '- „Wohne nicht weg von der Nordschleife" → „nicht weit von"',
      '- „Ich werden kommende Saison" → „Ich werde"',
      '- „Da alles davon total begeistert waren" → „Da alle davon"',
      '- „original Mitsubishi Teilen" → „Original-Mitsubishi-Teilen", „nie was negatives" → „nie was Negatives", Komma nach „fahren"',
    ].join('\n'),
  } as never,
})

payload.logger.info(
  `Team „AHG Racing" angelegt (ID ${team.id}): ein Fahrer, zwei Fahrzeuge, drei Ergebnisse, sechs Erfolge, drei Links, keine Bilder.`,
)
payload.logger.warn('NICHT VERÖFFENTLICHT: Bilder und Batteriemodell fehlen, Termine sind zu bestätigen. Alles in der internen Notiz.')
process.exit(0)
