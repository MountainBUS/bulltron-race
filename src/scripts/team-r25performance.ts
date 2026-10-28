/**
 * Legt das Rennteam R25Performance an — auf einer bereits laufenden Instanz,
 * ohne den Seed erneut auszuführen.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/team-r25performance.ts
 *
 * Mehrfach ausführbar: Gibt es den Eintrag schon, passiert nichts. So
 * überschreibt ein zweiter Lauf keine redaktionelle Arbeit.
 *
 * QUELLE der Inhalte: der ausgefüllte Fragebogen aus dem Formular „Unsere
 * Rennteams", eingegangen am 16.10.2026, sowie die Bilder im Ordner
 * „08_Teams/R25 Performance". Die Texte stehen so da, wie das Team sie
 * geschrieben hat; geändert sind nur zwei offensichtliche Tippfehler, die in
 * der internen Notiz einzeln aufgeführt sind.
 *
 * KEINE BATTERIE EINGETRAGEN: Das Feld „Eingesetztes Bulltron-Batteriemodell"
 * ist im Fragebogen leer geblieben, ebenso „Seit wann setzt ihr die Batterie
 * ein?", „Warum habt ihr euch für Bulltron entschieden?" und „Welche
 * Erfahrungen habt ihr bisher im Rennbetrieb gemacht?". Deshalb steht beim
 * Fahrzeug weder eine Verknüpfung noch ein Freitext. Das muss beim Team
 * nachgefragt werden — geraten wird hier nichts.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getPayload } from 'payload'
import config from '../payload.config'
import { doc, p } from '../seed/lexical'

const bilder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'assets', 'teams', 'r25performance')

/**
 * Die Bildunterschriften beschreiben nur, was auf den Fotos zu sehen ist.
 * Der Fragebogen hat die Frage „Wer ist auf welchem Foto?" leer gelassen,
 * deshalb steht in keinem Alternativtext ein Name — auf dem Teamfoto stehen
 * vier Personen, und welche davon wer ist, hat uns niemand gesagt.
 */
const dateien: Record<string, { datei: string; alt: string }> = {
  logo: { datei: 'r25performance-logo.png', alt: 'Logo des Rennteams R25Performance' },
  fahrerlager: {
    datei: 'r25performance-m2-fahrerlager.webp',
    alt: 'Hellblau-roter BMW M2 G87 mit der Startnummer 25 im Fahrerlager',
  },
  team: {
    datei: 'r25performance-team.webp',
    alt: 'Vier Mitglieder des Teams R25Performance vor dem BMW M2 in der Box, einer davon im Rennanzug mit Helm',
  },
  messe: {
    datei: 'r25performance-m2-messe.webp',
    alt: 'Der BMW M2 G87 von R25Performance auf einem Messestand',
  },
  startaufstellung: {
    datei: 'r25performance-m2-startaufstellung.webp',
    alt: 'Der BMW M2 G87 mit der Startnummer 25 in der Startaufstellung an der Boxenmauer',
  },
  champion: {
    datei: 'r25performance-champion-2025.webp',
    alt: 'Grafik zum Titelgewinn: ein Fahrer hebt den Pokal, darüber die Zeile „Supercars Champion" und das Logo der Time Attack Masters',
  },
}

const payload = await getPayload({ config })

const vorhanden = await payload.find({
  collection: 'teams',
  where: { teamName: { equals: 'R25Performance' } },
  limit: 1,
  overrideAccess: true,
})
if (vorhanden.docs.length > 0) {
  payload.logger.info('R25Performance steht bereits im Backend — es wird nichts geändert.')
  process.exit(0)
}

/** Lädt ein Bild hoch. Ein bereits hochgeladenes wird wiederverwendet. */
const medium = async (schluessel: keyof typeof dateien): Promise<number | undefined> => {
  const { datei, alt } = dateien[schluessel]
  const pfad = path.join(bilder, datei)
  if (!fs.existsSync(pfad)) {
    payload.logger.error(`Bilddatei fehlt: ${datei}`)
    return undefined
  }
  const schon = await payload.find({
    collection: 'media',
    where: { filename: { equals: datei } },
    limit: 1,
    overrideAccess: true,
  })
  if (schon.docs[0]) return schon.docs[0].id as number
  const neu = await payload.create({ collection: 'media', overrideAccess: true, data: { alt }, filePath: pfad })
  return neu.id as number
}

const team = await payload.create({
  collection: 'teams',
  overrideAccess: true,
  data: {
    teamName: 'R25Performance',
    published: true,
    /* Die fünf vorhandenen Teams stehen auf 1 bis 5. */
    sortOrder: 6,

    drivers: [{ name: 'Ronne Kerst' }],
    location: 'Obergünzburg',
    series: 'German & European Time Attack, Rundstrecke, Trackdays',

    intro: doc([
      p(
        'R25Performance ist ein kleines Privatteam. Unsere Wurzeln kommen aus dem Motorradsport (Motocross und Superbike). Nach dem Wechsel auf vier Räder, war nach den ersten zwei Trackdays klar wir brauchen Wettbewerb. Nach dem ersten Start in der German Time Attack haben wir kontinuierlich unseren neuen BMW M2 G87 weiterentwickelt. Mit dem Ergebnis, dass wir 2025 als Rookie Team die Supercar Klasse gewonnen haben. Im nächsten Winter haben wir das Auto auf die Pro Klasse umgebaut. Wo wir 2026 die German & European Time Attack Masters gewonnen haben.',
      ),
      p(
        'Wir sind sehr familiär und nehmen unsere Sache immer 110% ernst. Wir kommen nur um zu siegen, dafür tun wir alles mit unserer Leidenschaft für Motorsport. We are the Team with Passion!',
      ),
    ]),

    /* Das Team hat im Fragebogen ausdrücklich „Ja, mit Name und
       E-Mail-Adresse" angekreuzt — deshalb steht der Haken hier auf an. */
    contactName: 'Ronne Kerst',
    contactEmail: 'ronnekerst@freenet.de',
    contactPublic: true,

    /* Beide Adressen laufen auf den Fahrer, nicht auf ein Teamkonto — so
       stehen sie im Fragebogen. Eine Webseite hat das Team nicht angegeben. */
    social: [
      { label: 'Instagram', url: 'https://www.instagram.com/ronnekerst' },
      { label: 'Facebook', url: 'https://www.facebook.com/ronnekerst' },
    ],

    vehicles: [
      {
        driver: 'Ronne Kerst',
        manufacturer: 'BMW',
        model: 'M2 G87',
        year: '2023',
        engine: '3.0L Reihenzylinder Bi-Turbo',
        /* Die Antwort des Teams auf „Besonderheiten oder Umbauten" lautet
           wörtlich „Unendlich". Steht so da, weil es ihre Antwort ist. */
        modifications: 'Unendlich',
        photo: await medium('startaufstellung'),
      },
    ],

    results: [
      { date: '2026-04-11', event: 'German Time Attack Masters, Hockenheim', placement: 'P1 Klasse Pro' },
      { date: '2026-06-07', event: 'German Time Attack Masters, Oschersleben', placement: 'P4 Klasse Pro' },
      { date: '2026-08-02', event: 'German Time Attack Masters, Lausitzring', placement: 'P1 Klasse Pro' },
      { date: '2026-08-23', event: 'German Time Attack Masters, Salzburgring', placement: 'P1 Klasse Pro' },
      { date: '2026-09-13', event: 'German Time Attack Masters, Assen', placement: 'P1 Klasse Pro' },
      { date: '2026-10-11', event: 'German Time Attack Masters, Nürburgring', placement: 'P1 Klasse Pro' },
      { date: '2026-10-11', event: 'European Time Attack Masters, Nürburgring', placement: 'P1 Klasse Pro' },
    ],

    pastAchievements: [
      { year: '2025', title: 'German Time Attack Masters — Supercars Champion (Ronne Kerst)' },
      { year: '2025', title: 'European Time Attack Masters — Supercars P3 (Ronne Kerst)' },
    ],

    /* Einen Link zur Veranstaltung hat das Team nicht angegeben. */
    upcoming: [{ date: '2026-11-15', event: 'Italian Time Attack Masters', track: 'Mugello' }],

    logo: await medium('logo'),
    mainImage: await medium('fahrerlager'),
    gallery: [{ image: await medium('team') }, { image: await medium('champion') }, { image: await medium('messe') }],

    internalNote: [
      'Inhalte aus dem Formular „Unsere Rennteams", Eingang 16.10.2026, und den Bildern im Ordner 08_Teams/R25 Performance. Übernommen am 28.10.2026.',
      '',
      'Nutzungsrechte an den Bildern hat das Team im Formular bestätigt.',
      '',
      'Fehlt noch und muss beim Team nachgefragt werden:',
      '- DAS WICHTIGSTE: das eingesetzte Bulltron-Batteriemodell. Die vier Fragen dazu (Modell, seit wann, warum Bulltron, Erfahrungen im Rennbetrieb) sind im Fragebogen alle leer geblieben. Beim Fahrzeug steht deshalb keine Batterie — weder verknüpft noch als Freitext.',
      '- Wer auf welchem Foto zu sehen ist. Die Frage ist leer geblieben; auf dem Teamfoto stehen vier Personen. Deshalb steht in keinem Alternativtext ein Name.',
      '- Bildnachweise. Die Frage ist leer geblieben, zwei Dateinamen tragen aber „Instagram @japsite", was nach einem Fotografen aussieht. Falls eine Namensnennung vereinbart ist, gehört sie als Bildunterschrift an die beiden Bilder (Messestand und Startaufstellung).',
      '- Eine Webseite des Teams. Nicht angegeben; die beiden hinterlegten Links sind die privaten Konten von Ronne Kerst.',
      '- Ein Link zur kommenden Veranstaltung in Mugello.',
      '',
      'Im Formularfeld „Weitere Links" stand kein Link, sondern eine Liste von Unterstützern: Bulltron, 55Parts, SpecialConsepts, LiquiMoly, Flossmann Designs, Alpendruck, TR Performance. Die Sammlung hat kein Feld für Sponsoren, deshalb steht die Liste hier und nicht auf der Seite.',
      '',
      'Am Text der Vorstellung geändert, sonst nichts:',
      '- „Unsere Wurzel kommen" → „Unsere Wurzeln kommen"',
      '- „Mit dem Ergebniss das wir" → „Mit dem Ergebnis, dass wir"',
      'Zwei Sätze bleiben holprig („Nach dem Wechsel auf vier Räder, war …" und der mit „Wo wir 2026 …" beginnende). Das ist die Sprache des Teams und deshalb stehen geblieben — auf Zuruf glätte ich beides.',
      '',
      'Der Teamname steht als „R25Performance" da, so wie im Fragebogen. Das Logo schreibt ihn „R25 performance", der Ordner „R25 Performance".',
    ].join('\n'),
  } as never,
})

payload.logger.info(
  `Team „R25Performance" angelegt (ID ${team.id}), ein Fahrzeug, sieben Saisonergebnisse, zwei Erfolge, ein Termin, sechs Bilder.`,
)
payload.logger.warn('Beim Fahrzeug ist keine Batterie hinterlegt — der Fragebogen nennt keine. Bitte beim Team nachfragen.')
process.exit(0)
