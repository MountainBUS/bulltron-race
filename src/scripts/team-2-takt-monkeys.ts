/**
 * Legt das Rennteam 2-Takt Monkeys an — auf einer bereits laufenden Instanz,
 * ohne den Seed erneut auszuführen.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/team-2-takt-monkeys.ts
 *
 * Mehrfach ausführbar: Gibt es den Eintrag schon, passiert nichts. So
 * überschreibt ein zweiter Lauf keine redaktionelle Arbeit.
 *
 * QUELLE der Inhalte ist die Zuschrift des Teams vom 05.10.2026, die Bulltron
 * nach Anweisung von Roberto weitergereicht hat. Sie enthält genau vier
 * Angaben: Vor- und Nachname, den Teamnamen, vier Adressen in den sozialen
 * Netzen und die Bilder. Mehr steht hier auch nicht, denn mehr wurde nicht
 * gesagt.
 *
 * WAS DESHALB LEER BLEIBT — und was beim Team nachgefragt werden muss:
 *
 *   - Fahrzeuge. Kein einziges Feld ist belegbar: weder Hersteller, Modell und
 *     Baujahr noch Motor, Umbauten oder seit wann das Fahrzeug läuft. Vor allem
 *     fehlt die eingesetzte Bulltron-Batterie. Auf den Bildern sind Trabanten zu
 *     sehen, aber das ist meine Beobachtung und nicht die Angabe des Teams,
 *     deshalb steht es nicht im Eintrag.
 *   - Standort, Rennserie, Vorstellungstext, Ergebnisse, frühere Erfolge und
 *     kommende Termine. Alles nicht genannt.
 *   - Ein Foto des Fahrers. Die Zuschrift nennt es als „Anlage 1", geliefert
 *     wurden aber ausschließlich Fahrzeugbilder.
 *   - Teamlogo und E-Mail-Adresse.
 *
 * Eine Webseite hat das Team nach eigener Angabe nicht; das Feld bleibt
 * deswegen leer und nicht etwa versehentlich.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getPayload } from 'payload'
import config from '../payload.config'

const bilder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'assets', 'teams', '2-takt-monkeys')

/**
 * Die Bilder. Die Alternativtexte beschreiben, was auf dem Bild zu sehen ist —
 * Startnummern nur dort, wo sie zweifelsfrei zu lesen sind.
 *
 * HERKUNFT: Die ersten fünf sind die benannten Dateien „2-Takt Monkeys-1" bis
 * „-5"; das Hauptbild ist nach Marcos Vorgabe die Nummer 5. Die letzten drei
 * kamen ohne Dateinamen dazu.
 */
const dateien: Record<string, { datei: string; alt: string }> = {
  schlamm: {
    datei: '2-takt-monkeys-schlamm.webp',
    alt: 'Grauer Trabant mit der Startnummer 47 und aufgemaltem Haifischgebiss wirft auf schlammiger Strecke Erde auf',
  },
  strohballen: {
    datei: '2-takt-monkeys-strohballen.webp',
    alt: 'Weißer Trabant mit der Startnummer 61 auf der Schlammstrecke neben Strohballen, im Hintergrund grüne Hügel',
  },
  drift: {
    datei: '2-takt-monkeys-drift.webp',
    alt: 'Trabant mit der Startnummer 61 driftet in einer Staubwolke durch eine Kurve, dahinter ein hellblauer Trabant mit der Startnummer 55',
  },
  staub: {
    datei: '2-takt-monkeys-staub.webp',
    alt: 'Trabant mit der Startnummer 61 in Seitenansicht auf staubiger Strecke, im Hintergrund weitere Fahrzeuge',
  },
  acker: {
    datei: '2-takt-monkeys-acker.webp',
    alt: 'Trabant mit der Startnummer 57 wirft auf dem Acker Erde auf, dahinter Zuschauer',
  },
  fahrerlagerWiese: {
    datei: '2-takt-monkeys-fahrerlager-wiese.webp',
    alt: 'Grauer Trabant mit der Startnummer 51 und ein olivgrüner Trabant mit der Startnummer 20 nebeneinander im Fahrerlager',
  },
  fahrerlagerZelt: {
    datei: '2-takt-monkeys-fahrerlager-zelt.webp',
    alt: 'Grauer Trabant der 2-Takt Monkeys unter einem Zelt im Fahrerlager, daneben ein orangefarbener Trabant',
  },
  publikum: {
    datei: '2-takt-monkeys-publikum.webp',
    alt: 'Grauer Trabant der 2-Takt Monkeys in Seitenansicht, dahinter Zuschauer am Absperrgitter',
  },
}

const payload = await getPayload({ config })

/* Schon vorhanden? Dann nichts anfassen. */
const vorhanden = await payload.find({
  collection: 'teams',
  where: { slug: { equals: '2-takt-monkeys' } },
  limit: 1,
  overrideAccess: true,
})
if (vorhanden.docs.length > 0) {
  payload.logger.info('2-Takt Monkeys steht bereits im Backend — es wird nichts geändert.')
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
    teamName: '2-Takt Monkeys',
    published: true,

    drivers: [{ name: 'Mathias Schlag' }],

    /* Steht in der Zuschrift, gehört aber nicht ungefragt auf die Seite:
       deshalb nur im Backend, bis das Team der Veröffentlichung zustimmt.
       Dasselbe Vorgehen wie bei AC Racing. */
    contactName: 'Mathias Schlag',
    contactPublic: false,

    social: [
      { label: 'Instagram', url: 'https://www.instagram.com/2taktmonkeys/' },
      { label: 'Facebook', url: 'https://www.facebook.com/2taktmonkeys/' },
      { label: 'TikTok', url: 'https://www.tiktok.com/@2takt.monkeys' },
      { label: 'YouTube', url: 'https://www.youtube.com/@2taktmonkeys' },
    ],

    mainImage: await medium('schlamm'),
    gallery: [
      { image: await medium('strohballen') },
      { image: await medium('drift') },
      { image: await medium('staub') },
      { image: await medium('acker') },
      { image: await medium('fahrerlagerWiese') },
      { image: await medium('fahrerlagerZelt') },
      { image: await medium('publikum') },
    ],

    internalNote: [
      'Angelegt am 05.10.2026 aus der Zuschrift des Teams, die Bulltron nach Anweisung von Roberto weitergereicht hat.',
      '',
      'Die Zuschrift enthielt nur Name, Teamname, vier Adressen in den sozialen Netzen und Bilder. Alles andere ist deshalb leer.',
      '',
      'Nachzufragen:',
      '- Fahrzeuge: Hersteller, Modell, Baujahr, Motor, Umbauten, im Einsatz seit — und vor allem, WELCHE BULLTRON-BATTERIE verbaut ist. Ohne diese Angabe fehlt der Seite genau der Punkt, um den es geht.',
      '- Foto des Fahrers. In der Zuschrift als "Anlage 1" angekuendigt, geliefert wurden aber nur Fahrzeugbilder.',
      '- Standort/Heimatort und Rennserie oder Klasse.',
      '- Ein Vorstellungstext des Teams.',
      '- Ergebnisse der laufenden Saison, frühere Erfolge, kommende Termine mit Datum.',
      '- Teamlogo.',
      '- E-Mail-Adresse für Rückfragen.',
      '',
      'Zu den Bildern:',
      '- Hauptbild ist "2-Takt Monkeys-5" nach Marcos ausdrücklicher Vorgabe.',
      '- Benannt geliefert wurden "2-Takt Monkeys-1" bis "-5". Drei weitere Bilder (Fahrerlager auf der Wiese, Fahrerlager unterm Zelt, Wagen vor dem Publikum) kamen ohne Dateinamen dazu und stehen hier in der Galerie.',
      '- Die Zuschrift kuendigt "hohe Aufloesung fuer den Druck" an. Das trifft auf die benannten Dateien nicht zu: "-5" hat 2048 x 1152 Pixel, das sind bei 300 dpi rund 17 x 10 cm; "-4" hat 853 x 568 Pixel, also rund 7 x 5 cm. Nur eines der drei unbenannten Bilder (Fahrerlager auf der Wiese, 5712 x 4284) ist druckfaehig. Fuer Druckerzeugnisse muessen die Originale nachgefordert werden.',
      '- Die Wagen tragen auf den Bildern verschiedene Startnummern (61, 57, 47, 51 und eine nicht sicher lesbare). Ob das ein Fahrzeug ueber mehrere Saisons ist oder mehrere Fahrzeuge, geht aus den Bildern nicht hervor und steht deshalb nirgends im Eintrag.',
      '',
      'Webseite: Das Team hat ausdruecklich angegeben, keine zu haben. Das Feld ist also absichtlich leer.',
    ].join('\n'),
  } as never,
})

payload.logger.info(`Team „2-Takt Monkeys" angelegt (ID ${team.id}), ein Fahrer, vier Links, acht Bilder.`)
process.exit(0)
