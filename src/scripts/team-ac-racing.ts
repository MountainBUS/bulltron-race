/**
 * Legt das Rennteam AC Racing an — auf einer bereits laufenden Instanz, ohne
 * den Seed erneut auszuführen.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/team-ac-racing.ts
 *
 * Mehrfach ausführbar: Gibt es den Eintrag schon, passiert nichts. So
 * überschreibt ein zweiter Lauf keine redaktionelle Arbeit.
 *
 * QUELLE der Inhalte: der ausgefüllte Fragebogen `Infos.pdf` aus dem Ordner
 * „08_Teams/Team AC Racing" sowie die dort liegenden Fotos. Texte stehen so da,
 * wie das Team sie geschrieben hat; geändert wurden nur offensichtliche
 * Tippfehler.
 *
 * NICHT im Fragebogen enthalten und deshalb hier auch nicht gesetzt:
 * Renntermine mit Datum (nur „German Time Attack Nürburgring inkl. European
 * Time Attack Masters" ohne Datum — das Datumsfeld ist Pflicht), Ergebnisse der
 * laufenden Saison, Webseite des Teams, die Instagram-Adressen und Fotos der
 * beiden Fahrer.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getPayload } from 'payload'
import config from '../payload.config'
import { doc, h, p } from '../seed/lexical'

const bilder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'assets', 'teams', 'ac-racing')

/**
 * Zuordnung der Fahrzeugfotos, und woher sie belegt ist:
 *
 * - Der blaue Wagen trägt „C. Möller" am Seitenfenster und hat die Karosserie
 *   des Evo X — das ist Christians Evo 10.
 * - Der schwarze Wagen mit der Startnummer 19 ist die ältere Evo-IX-Form und
 *   damit Alex' Evo 9, das einzige Fahrzeug dieser Generation im Team.
 * - Die Supra ist an der Castrol-Lackierung eindeutig.
 */
const dateien: Record<string, { datei: string; alt: string }> = {
  team: {
    datei: 'ac-racing-team.webp',
    alt: 'Toyota Supra MK4 in Castrol-Lackierung und schwarzer Mitsubishi Evo mit der Startnummer 19 nebeneinander auf dem Boxenvorplatz',
  },
  logo: { datei: 'ac-racing-logo.png', alt: 'Logo des Rennteams AC Racing' },
  evo9: {
    datei: 'ac-racing-evo9.webp',
    alt: 'Schwarzer Mitsubishi Evo 9 mit der Startnummer 19 in der Box',
  },
  evo10: {
    datei: 'ac-racing-evo10.webp',
    alt: 'Blauer Mitsubishi Evo 10 von Christian Möller mit der Startnummer 36 in der Boxengasse',
  },
  supra: {
    datei: 'ac-racing-supra.webp',
    alt: 'Toyota Supra MK4 in Castrol-Lackierung mit der Startnummer 36 auf dem Boxenvorplatz',
  },
  boxengasse: { datei: 'ac-racing-boxengasse.webp', alt: 'Blauer Mitsubishi Evo 10 in der Boxengasse' },
  motorraum: { datei: 'ac-racing-motorraum.webp', alt: 'Geöffnete Motorhaube des Mitsubishi Evo 10 in der Box' },
  boxenstopp: { datei: 'ac-racing-boxenstopp.webp', alt: 'Arbeiten am Fahrzeug in der Boxengasse' },
  boxArbeit: { datei: 'ac-racing-box-arbeit.webp', alt: 'Reifenwechsel in der Box' },
  helm: { datei: 'ac-racing-helm.webp', alt: 'Fahrer mit Helm und Hans-System im Fahrzeug' },
  supraEvo: { datei: 'ac-racing-supra-evo.webp', alt: 'Toyota Supra MK4 und Mitsubishi Evo auf dem Boxenvorplatz' },
}

const payload = await getPayload({ config })

/* Schon vorhanden? Dann nichts anfassen. */
const vorhanden = await payload.find({
  collection: 'teams',
  where: { slug: { equals: 'ac-racing' } },
  limit: 1,
  overrideAccess: true,
})
if (vorhanden.docs.length > 0) {
  payload.logger.info('AC Racing steht bereits im Backend — es wird nichts geändert.')
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

/* Die eingesetzte Batterie ist die Race 12 Ah (1000 A). Steht sie wider
   Erwarten nicht im Shop, trägt das Freitextfeld die Angabe. */
const batterieTreffer = await payload.find({
  collection: 'products',
  where: { sku: { equals: 'LI12B1000-12-R' } },
  limit: 1,
  overrideAccess: true,
})
const batterie = batterieTreffer.docs[0]?.id as number | undefined
if (!batterie) payload.logger.warn('Produkt LI12B1000-12-R nicht gefunden — Batterie wird als Freitext eingetragen.')

const batteriefelder = batterie ? { battery: batterie } : { batteryOther: '12 Ah / 1000 A' }

const team = await payload.create({
  collection: 'teams',
  overrideAccess: true,
  data: {
    teamName: 'AC Racing',
    published: true,
    series: 'Time Attack',

    drivers: [{ name: 'Alexander Tatarschuk' }, { name: 'Christian Möller' }],

    intro: doc([
      h('h3', 'Alexander Tatarschuk'),
      p(
        'Hallo, ich heiße Alexander Tatarschuk, bin 35 Jahre alt und schon von klein auf an mit Leidenschaft im Motorsport interessiert. Ich bin hauptberuflich IT-Leiter in einer Ernährungsklinik und im Nebengewerbe widme ich mich der Thermoisolierung von Bauteilen sowie Schweißarbeiten für unsere Fahrzeuge. Ich fahre seit mehr als 6 Jahren mit Christian zusammen im Team und könnte mir nichts Besseres vorstellen. Uns zeichnet als Team der starke Zusammenhalt und der Wille besser zu werden aus.',
      ),
      h('h3', 'Christian Möller'),
      p(
        'Christian Möller, 44 Jahre alt. Selbstständig mit eigenem Autohaus. Durch Leidenschaft am Automobil und den Kontakt mit Alex in den Rennsport gekommen und erfolgreich im Team AC Racing mehrere Titel im Mitsubishi Evo X geholt.',
      ),
    ]),

    /* Steht im Fragebogen, gehört aber nicht ungefragt auf die Seite: Deshalb
       nur im Backend, bis das Team der Veröffentlichung zustimmt. */
    contactName: 'Alexander Tatarschuk',
    contactEmail: 'info@racetherm.de',
    contactPublic: false,

    social: [{ label: 'YouTube', url: 'https://www.youtube.com/@ACRacing0910' }],

    vehicles: [
      {
        driver: 'Alexander Tatarschuk',
        manufacturer: 'Mitsubishi',
        model: 'Evo 9',
        year: '2006',
        engine: '4G63T / 2,0 / 450+ PS',
        modifications:
          'Motor und Getriebe gebaut von Boldt Motorsport und abgestimmt durch Haarmann Software Development, Alu Ansaugung sowie Thermoisolierung von Racetherm, KW v4 Racing Fahrwerk von TR Performance, AP Racing Pro 5000R Bremse von 55 Parts, Bodyparts original, Felgen in 9,5x18 ET 30, Reifen Extreme Tires VR2 in 265/35 18, OMP Vollschale und Recaro Pole Rennsitze, Safety Device Käfig, Bulltron Race Motorsport Batterie.',
        ...batteriefelder,
        since: '2026',
        reason:
          'Wir suchen immer wieder nach Bauteilen die wir mit leichteren ersetzen können. Außerdem hatte ich oft Probleme mit der Kaltstartleistung bei der vorherigen Batterie.',
        experience:
          'Zuverlässig und kostengünstig. Auch nach mehrmaligem Start hohe Startdrehzahl. Sehr leicht zu einem Top Preis!',
        photo: await medium('evo9'),
      },
      {
        driver: 'Christian Möller',
        manufacturer: 'Toyota',
        model: 'Supra MK4',
        year: '1993',
        engine: '2JZ / 3,0 / 800+ PS',
        modifications:
          'BMW 6-Gang Getriebe, kompletter Motoraufbau inkl. Singleturbo, KW V4 Competition Fahrwerk, Wisefab Hinterachse, Hardrace Vorderachse, Brembo Bremsanlage (F40) vorne, Breitbau, Castrol Replika.',
        ...batteriefelder,
        since: '2026',
        reason:
          'Drei Batterien anderer Hersteller im Rennen versagt in Saison 2025, daher Alternative gesucht.',
        experience: 'Zuverlässig und kostengünstig. Auch nach mehrmaligem Start hohe Startdrehzahl.',
        photo: await medium('supra'),
      },
      {
        driver: 'Christian Möller',
        manufacturer: 'Mitsubishi',
        model: 'Evo 10',
        year: '2010',
        engine: '4B11T / 2,0 / 750 PS',
        modifications:
          'Varis Carbon Breitbau, Drenth 6-Gang sequenzielles Getriebe, kompletter Motorumbau von Boldt Motorsport, Link ECU, AP-Racing Bremse vorne, Alcon Bremse hinten, KW V3 Competition Fahrwerk, APR Spoiler.',
        ...batteriefelder,
        since: 'Saison 2026',
        reason: 'Probleme mit Lithium-Leichtbaubatterien anderer Hersteller.',
        experience:
          'Extrem zuverlässig, hohe Kaltstartleistung und hohe Startdrehzahl, auch nach mehrmaligem Starten.',
        photo: await medium('evo10'),
      },
    ],

    /* Der Fragebogen führt die Erfolge je Fahrer auf; der Zusatz in Klammern
       hält diese Zuordnung fest, weil die Liste am Team hängt. */
    pastAchievements: [
      { year: '2021', title: 'Deutscher Meister (Alexander Tatarschuk)' },
      { year: '2022', title: 'Deutscher Meister (Christian Möller, Evo 10)' },
      { year: '2022', title: 'Europameister (Christian Möller, Evo 10)' },
      { year: '2023', title: 'Deutscher Meister (Christian Möller, Evo 10)' },
      { year: '2025', title: 'Vize-Deutscher Meister (Alexander Tatarschuk)' },
      { year: '2025', title: 'Europameister (Alexander Tatarschuk)' },
      { year: '2026', title: 'Zweimal Platz 4 und einmal Platz 2 (Christian Möller, Supra MK4)' },
    ],

    logo: await medium('logo'),
    mainImage: await medium('team'),
    gallery: [
      { image: await medium('boxengasse') },
      { image: await medium('supraEvo') },
      { image: await medium('motorraum') },
      { image: await medium('boxenstopp') },
      { image: await medium('boxArbeit') },
      { image: await medium('helm') },
    ],

    internalNote: [
      'Inhalte aus dem ausgefüllten Fragebogen (Infos.pdf) und den Fotos im Ordner 08_Teams/Team AC Racing, übernommen am 25.09.2026.',
      '',
      'Fehlt noch und muss beim Team nachgefragt werden:',
      '- Datum der kommenden Renntermine. Genannt ist nur „German Time Attack Nürburgring inkl. European Time Attack Masters"; ohne Datum lässt sich kein Termin anlegen.',
      '- Ergebnisse der laufenden Saison (im Fragebogen leer gelassen).',
      '- Webseite des Teams (im Fragebogen leer gelassen).',
      '- Instagram-Adressen: genannt sind „AC Racing" (Team), „Autohaus Kirschstein" (Christian) und „Racetherm" (Alex), aber ohne Nutzernamen.',
      '- Fotos der beiden Fahrer: In den Bildern gibt es zwei Porträts, aber keines ist beschriftet. Wer wer ist, muss das Team sagen.',
      '',
      'Ansprechpartner und E-Mail stehen absichtlich nur hier im Backend. Der Haken „Ansprechpartner öffentlich zeigen" bleibt aus, bis das Team zustimmt.',
    ].join('\n'),
  } as never,
})

payload.logger.info(`Team „AC Racing" angelegt (ID ${team.id}), drei Fahrzeuge, sieben Erfolge, acht Bilder.`)
process.exit(0)
