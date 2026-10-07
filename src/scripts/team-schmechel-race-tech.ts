/**
 * Legt das Rennteam Schmechel Race Tech an — auf einer bereits laufenden
 * Instanz, ohne den Seed erneut auszuführen.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/team-schmechel-race-tech.ts
 *
 * MEHRFACH AUSFÜHRBAR: Gibt es den Eintrag schon, passiert nichts. So
 * überschreibt ein zweiter Lauf keine redaktionelle Arbeit.
 *
 * QUELLE ist der ausgefüllte Fragebogen des Teams, den Marco am 07.10.2026
 * weitergereicht hat, samt sechs Bildern und der schriftlichen Einwilligung,
 * Bilder und Logo für die Teamvorstellung auf der Bulltron-Race-Seite zu
 * nutzen. Jeder anderen Verwendung hat das Team ausdrücklich widersprochen;
 * die Einwilligung ist jederzeit widerrufbar.
 *
 * AM TEXT GEÄNDERT habe ich nur offensichtliche Schreibfehler, damit nichts
 * umgedeutet wird:
 *   „auf einen VW Polo" -> „auf einem", „6n" -> „6N", „w2" -> „W2",
 *   „Ralley-Sport" -> „Rallye-Sport", „suspention" -> „suspension",
 *   „controld" -> „controlled".
 * Inhaltlich steht nichts im Eintrag, was nicht im Fragebogen steht.
 *
 * ZWEI STELLEN BLEIBEN BEWUSST OFFEN, weil der Bogen sie nicht hergibt — beide
 * stehen auch in der internen Notiz:
 *   - Seit wann die Batterie im Einsatz ist. Der Bogen erzählt nur, dass sie
 *     „im letzten Rennen" aushalf und behalten wurde, ohne Datum.
 *   - Ergebnisse der laufenden Saison. Genannt wird, dass das Qualifying in
 *     Wertung gefahren wurde, aber keine Platzierung.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getPayload } from 'payload'
import config from '../payload.config'
import { doc, p } from '../seed/lexical'

const bilder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'assets', 'teams', 'schmechel-race-tech')

/**
 * Die Bilder. Die Alternativtexte beschreiben, was zu sehen ist.
 *
 * HERKUNFT, vom Team angegeben: Die beiden Aufnahmen mit „japsite" im
 * Dateinamen sind von Ricky Schäfer (JAPSite) und tragen dessen Wasserzeichen;
 * sie bekommen deshalb eine Bildunterschrift mit der Nennung. Die übrigen vier
 * stammen vom Team selbst.
 */
const dateien: Record<string, { datei: string; alt: string }> = {
  startaufstellung: {
    datei: 'schmechel-race-tech-startaufstellung.webp',
    alt: 'Weißer Toyota MR2 mit der Startnummer 70 und großem Heckflügel von schräg hinten in der Startaufstellung, dahinter Zuschauer',
  },
  strecke: {
    datei: 'schmechel-race-tech-strecke.webp',
    alt: 'Weißer Toyota MR2 mit der Startnummer 70 in voller Fahrt auf der Rennstrecke, der Hintergrund ist von der Mitzieher-Aufnahme verwischt',
  },
  boxengasse: {
    datei: 'schmechel-race-tech-boxengasse.webp',
    alt: 'Weißer Toyota MR2 mit der Startnummer 70 rollt durch die Boxengasse, im Hintergrund Werbebanden und leere Tribünenplätze',
  },
  werkstatt: {
    datei: 'schmechel-race-tech-werkstatt.webp',
    alt: 'Heckansicht des weißen Toyota MR2 mit Doppelflügel in der Werkstatt vor grüner Wand',
  },
  fahrer: {
    datei: 'schmechel-race-tech-fahrer.webp',
    alt: 'Patrick Schmechel im Rennanzug mit Helm in der Hand vor seinem Toyota MR2 in der Box',
  },
  logo: {
    datei: 'schmechel-race-tech-logo.png',
    alt: 'Logo von Schmechel Race Tech: die Silhouette eines Rennwagens mit Heckflügel über dem Schriftzug',
  },
}

const payload = await getPayload({ config })

const vorhanden = await payload.find({
  collection: 'teams',
  where: { slug: { equals: 'schmechel-race-tech' } },
  limit: 1,
  overrideAccess: true,
})
if (vorhanden.docs.length > 0) {
  payload.logger.info('Schmechel Race Tech steht bereits im Backend — es wird nichts geändert.')
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

/* Die Batterie wird über die Artikelnummer gesucht, nicht über den Namen:
   Namen ändern sich redaktionell, die SKU nicht. Angegeben ist „27Ah L1",
   das ist die Race 27 Ah im L1-Gehäuse. */
const SKU = 'LI27B700-12-RL1'
const batterie = (
  await payload.find({ collection: 'products', where: { sku: { equals: SKU } }, limit: 1, depth: 0, overrideAccess: true })
).docs[0]?.id as number | undefined
if (!batterie) payload.logger.warn(`Produkt ${SKU} nicht gefunden — die Batterie wird als Freitext eingetragen.`)

const team = await payload.create({
  collection: 'teams',
  overrideAccess: true,
  data: {
    teamName: 'Schmechel Race Tech',
    published: true,
    location: 'Hamburg',
    series: 'Timeattack Masters (German & European), Klasse Pro',

    drivers: [{ name: 'Patrick Schmechel', photo: await medium('fahrer') }],

    intro: doc([
      p(
        'Patrick betreibt schon lange Motorsport. Er hat im Automobilslalom angefangen und erfolgreich Meisterschaften im Norden Deutschlands gewonnen. Damals noch auf einem VW Polo 6N.',
      ),
      p(
        'Timeattack ist er zuerst 2017 gefahren — zuerst auch schon mit einem Toyota MR2 W2 Turbo, allerdings in der Klasse Club. Ab 2019 hat er dann erfolgreich mit einem extrem umgebauten VW Polo 6N in der Klasse Pocket Rocket teilgenommen und konnte zweifacher Europavizemeister werden.',
      ),
      p(
        'Seit 2023 fährt er mit seinem speziell für die Klasse Pro der Timeattack aufgebauten Toyota MR2 W2 Turbo. Zudem startete er 2025 im nationalen Rallye-Sport.',
      ),
    ]),

    /* Steht im Fragebogen, gehört aber nicht ungefragt auf die Seite: deshalb
       nur im Backend, bis das Team der Veröffentlichung zustimmt. Dasselbe
       Vorgehen wie bei AC Racing und den 2-Takt Monkeys. Die zweite
       Ansprechpartnerin steht in der internen Notiz, das Feld fasst nur eine. */
    contactName: 'Patrick Schmechel',
    contactEmail: 'patrickschmechel2311@gmail.com',
    contactPublic: false,

    /* Von Instagram und YouTube sind die Zählparameter entfernt (?stkn= und
       ?si=): Das sind Weitergabe-Kennungen aus der App, die auf einer
       öffentlichen Seite nichts zu suchen haben und am Ziel nichts ändern. */
    social: [
      { label: 'Instagram', url: 'https://www.instagram.com/schmechel_race_tech/' },
      { label: 'YouTube', url: 'https://www.youtube.com/@schmechelracetech' },
      { label: 'Facebook', url: 'https://www.facebook.com/share/1FsLxcePN9/' },
    ],

    vehicles: [
      {
        manufacturer: 'Toyota',
        model: 'MR2 W2 Turbo',
        year: '1998',
        engine: '3S-GTE, 2,0 l, 500+ PS',
        modifications:
          'MR2 Coupé, RHD-Japanimport. Umbauten by Schmechel Race Tech: CFK-Bodyparts, fully build engine, Aeropaket, 8-point-Cage, custom D2 suspension plus Geometrie-Kit, WP-Pro-Brakes, controlled by Ecumaster.',
        ...(batterie ? { battery: batterie } : { batteryOther: 'Race 27 Ah L1' }),
        reason:
          'Im letzten Rennen ist unsere Lichtmaschine kaputt gegangen und wir hatten keine Batterie mit, die genug Leistung hatte, um die notwendigen Runden ohne Lichtmaschine durchzuhalten. Robert konnte aushelfen und hat uns eine Batterie mit größtmöglicher Kapazität zur Verfügung gestellt.',
        experience:
          'So konnten wir das Qualifying trotz zahlreicher Verbraucher (elektrische Wasserpumpe, elektrische Servolenkung, Lüfter und weitere) ohne Probleme in Wertung fahren. Die Batterie haben wir dann direkt behalten. Wir werden uns außerdem eine zweite, kleinere Batterie als Backup dazu holen.',
        photo: await medium('werkstatt'),
      },
    ],

    /* „Vergangene Erfolge (siehe oben)" — der Bogen verweist auf den
       Vorstellungstext. Aufgenommen ist daraus, was dort als Erfolg benannt
       ist; die übrige Laufbahn steht im Vorstellungstext und wird hier nicht
       doppelt erzählt. Jahreszahlen stehen nur dort, wo der Bogen welche
       nennt. */
    pastAchievements: [
      { title: 'Automobilslalom: Meisterschaften im Norden Deutschlands (VW Polo 6N)' },
      { year: 'ab 2019', title: 'Timeattack, Klasse Pocket Rocket (VW Polo 6N) — zweifacher Europavizemeister' },
    ],

    upcoming: [
      {
        date: '2026-10-11',
        event: 'European Timeattack und German Timeattack',
        track: 'Nürburgring',
      },
    ],

    logo: await medium('logo'),
    /* Hauptbild ist eine Aufnahme des Teams selbst, nicht eine der beiden von
       Ricky Schäfer: Das Hauptbild hat kein Feld für eine Bildunterschrift,
       die Nennung des Fotografen ließe sich dort also nicht unterbringen. Die
       beiden JAPSite-Bilder stehen deshalb in der Galerie, wo die Nennung
       mitläuft. */
    mainImage: await medium('startaufstellung'),
    gallery: [
      { image: await medium('strecke'), caption: 'Foto: Ricky Schäfer (JAPSite)' },
      { image: await medium('boxengasse'), caption: 'Foto: Ricky Schäfer (JAPSite)' },
      { image: await medium('werkstatt') },
      { image: await medium('fahrer') },
    ],

    internalNote: [
      'Angelegt am 07.10.2026 aus dem ausgefuellten Fragebogen des Teams.',
      '',
      'EINWILLIGUNG: Das Team hat der Nutzung der gelieferten Bilder und Logos fuer die Teamvorstellung auf der Bulltron-Race-Webseite zum Bewerben der Bulltron-Batterien schriftlich zugestimmt und jeder anderen Verwendung ausdruecklich widersprochen. Die Einwilligung ist freiwillig und jederzeit ganz oder teilweise widerrufbar.',
      '',
      'Nachzufragen:',
      '- Seit wann die Batterie im Einsatz ist. Der Bogen nennt kein Datum, nur "im letzten Rennen". Das Feld "Im Einsatz seit" ist deshalb leer.',
      '- Ergebnisse der laufenden Saison mit Platzierung. Genannt ist nur, dass das Qualifying in Wertung gefahren wurde.',
      '- Die beiden Europavizemeistertitel haben keine Jahreszahlen. Im Bogen steht "ab 2019 ... zweifacher Europavizemeister", deshalb steht im Jahresfeld "ab 2019" statt einer erfundenen Zahl.',
      '- Termine der Timeattack-Saison 2027. Im Bogen angekuendigt ("Termine folgen"), ohne Datum kann kein Termin eingetragen werden.',
      '- Im Text zur Batterie steht "Robert konnte aushelfen". Bei Bulltron ist von Roberto die Rede. Der Name steht so, wie das Team ihn geschrieben hat; bitte vor der Veroeffentlichung klaeren.',
      '- Facebook ist als Weitergabe-Link angegeben (facebook.com/share/...). Solche Links koennen ablaufen. Bitte die eigentliche Seitenadresse nachreichen.',
      '',
      'Zweite Ansprechpartnerin laut Bogen: Angela Behdau, angelabehdau.ab@gmail.com. Das Feld fasst nur einen Kontakt, eingetragen ist Patrick. Beide Adressen sind NICHT oeffentlich (Haken "Ansprechpartner oeffentlich zeigen" ist aus).',
      '',
      'Zu den Bildern:',
      '- Quelle laut Team: "japs (im Bildnamen - Ricky Schaefer) & Schmechel Race Tech".',
      '- Die beiden Dateien mit "japsite" im Namen tragen dessen Wasserzeichen und stehen in der Galerie mit der Nennung "Foto: Ricky Schaefer (JAPSite)" als Bildunterschrift.',
      '- Hauptbild ist bewusst eine Aufnahme des Teams (Startaufstellung, Heckansicht): Das Hauptbild hat kein Feld fuer eine Bildunterschrift, eine Fotografennennung waere dort nicht unterzubringen.',
      '- Das Logo kam als JPEG 2048 x 2026 auf schwarzem Grund, wobei das Motiv nur einen Streifen von 1281 x 309 Pixeln einnahm, also rund ein Zehntel der Flaeche. In der 70-Pixel-Kachel der Teamseite waere der Schriftzug unlesbar gewesen. Es ist deshalb auf das Motiv beschnitten und als PNG mit Transparenz hinterlegt, damit kein schwarzer Kasten auf dem dunklen Seitenhintergrund steht. Das Motiv selbst ist unveraendert.',
      '- Bilder in Druckaufloesung liegen nicht vor: die groesste Datei hat 2048 x 1152 Pixel, das sind bei 300 dpi rund 17 x 10 cm. Fuer Druckerzeugnisse muessen die Originale nachgefordert werden.',
    ].join('\n'),
  } as never,
})

payload.logger.info(
  `Team „Schmechel Race Tech" angelegt (ID ${team.id}): ein Fahrer, ein Fahrzeug, drei Links, zwei frueher Erfolge, ein Termin, Logo und fuenf Bilder.`,
)
payload.logger.info(
  batterie
    ? `Batterie verknuepft: ${SKU} (Produkt-ID ${batterie}) — die Teamseite verlinkt damit auf das Produkt.`
    : `Batterie als Freitext eingetragen, weil ${SKU} nicht gefunden wurde.`,
)
process.exit(0)
