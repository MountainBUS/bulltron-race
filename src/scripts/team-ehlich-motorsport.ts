/**
 * Legt das Rennteam Ehlich Motorsport an — auf einer bereits laufenden
 * Instanz, ohne den Seed erneut auszuführen.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/team-ehlich-motorsport.ts
 *
 * MEHRFACH AUSFÜHRBAR: Gibt es den Eintrag schon, passiert nichts. So
 * überschreibt ein zweiter Lauf keine redaktionelle Arbeit.
 *
 * QUELLE ist der ausgefüllte Fragebogen „Ehlich Motorsport.docx", den Marco am
 * 07.10.2026 weitergereicht hat, samt drei Bildern.
 *
 * DAS WICHTIGSTE FELD FEHLT: Welche Bulltron-Batterie eingesetzt wird, steht
 * nicht im Bogen. Zur Frage nach dem Batteriemodell hat das Team nur
 * geantwortet, warum es sich für Bulltron entschieden hat. Beide Batteriefelder
 * am Fahrzeug bleiben deshalb leer — die Teamseite verlinkt damit auf kein
 * Produkt, und genau der Punkt, um den es bei diesen Seiten geht, fehlt. Bitte
 * nachfragen, bevor der Eintrag veröffentlicht wird.
 *
 * KEINE EINWILLIGUNG ZUR BILDNUTZUNG: Anders als beim Fragebogen von Schmechel
 * Race Tech enthält dieser keine Einwilligung für Bilder und Logos. Auf dem
 * Werkstattbild sind zwei Personen erkennbar. Vor der Veröffentlichung sollte
 * die Freigabe schriftlich vorliegen; deshalb steht der Eintrag auf „nicht
 * veröffentlicht".
 *
 * AM TEXT GEÄNDERT habe ich nur offensichtliche Schreibfehler:
 *   „angaschiertes" -> „engagiertes", „TimeAttacke" -> „Time Attack",
 *   „heben wir erst zwei Veranstaltungen ... fahren können" -> „haben wir",
 *   „Season" -> „Saison", doppelte Leerzeichen.
 * Inhaltlich steht nichts im Eintrag, was nicht im Bogen steht.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getPayload } from 'payload'
import config from '../payload.config'
import { doc, p } from '../seed/lexical'

const bilder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'assets', 'teams', 'ehlich-motorsport')

const dateien: Record<string, { datei: string; alt: string }> = {
  strecke: {
    datei: 'ehlich-motorsport-strecke.webp',
    alt: 'Roter Radical SR3 mit der Startnummer 1340 in Seitenansicht auf der Rennstrecke, der Fahrer im weißen Helm ist im offenen Cockpit zu sehen',
  },
  kurve: {
    datei: 'ehlich-motorsport-kurve.webp',
    alt: 'Roter Radical SR3 von hinten am Kurvenausgang, daneben die blau-weißen Randsteine der Strecke',
  },
  werkstatt: {
    datei: 'ehlich-motorsport-werkstatt.webp',
    alt: 'Zwei Personen arbeiten in der Werkstatt am roten Radical SR3, im Hintergrund ein zweites Fahrzeug und Werkzeug',
  },
}

const payload = await getPayload({ config })

const vorhanden = await payload.find({
  collection: 'teams',
  where: { slug: { equals: 'ehlich-motorsport' } },
  limit: 1,
  overrideAccess: true,
})
if (vorhanden.docs.length > 0) {
  payload.logger.info('Ehlich Motorsport steht bereits im Backend — es wird nichts geändert.')
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
    teamName: 'Ehlich Motorsport',
    /* Absichtlich aus: Solange weder das Batteriemodell noch eine
       Bildfreigabe vorliegt, gehoert der Eintrag nicht auf die Website.
       Im Backend ist er vollstaendig da und kann mit einem Haken sichtbar
       gemacht werden. */
    published: false,
    location: 'Schönbach bei Kirchhain',
    series: 'Sportwagen Sprint, Oldtimer Trackdays, Time Attack',

    drivers: [{ name: 'Sven Ehlich' }],

    /* Der zweite Absatz stammt aus den Antworten zu „Erfolge" und zur
       aktuellen Lage des Teams. Er steht hier, weil der Bogen zu den beiden
       Renneinsätzen keine Veranstaltungsnamen nennt und das Feld „Ergebnisse"
       einen Namen verlangt — erfunden wird keiner. Die Worte sind die des
       Teams. */
    intro: doc([
      p(
        'Wir sind ein junges, engagiertes Motorsport-Team, welches den Motorsportfans durch Taxifahrten ermöglichen möchte, den Sport zu fühlen und zu erleben. Wir bieten unter anderem Rennfahrzeugvermietung an. Zum Motorsport sind wir vor 15 Jahren gekommen, damals waren wir Mitglieder eines Motorsportclubs; vor einem Jahr haben wir beschlossen, uns mit Taxifahrten und Rennfahrzeugvermietung selbstständig zu machen, und versuchen, alle Wünsche möglich zu machen.',
      ),
      p(
        'Da wir als Team erst seit einem Jahr am Start sind, haben wir noch nicht viel nachzuweisen. Wir sind hauptsächlich im Sportwagen Sprint unterwegs sowie als Taxifahrzeug bei Oldtimer Trackdays. Mit dem Radical haben wir erst zwei Veranstaltungen im Rennbetrieb fahren können, beide leider mit einem DNF durch technisches Versagen: das erste Rennen am 11. April 2026, das zweite nach komplettem Neuaufbau vom 11. bis 13. September 2026. Für die kommende Saison ist geplant, beim Sportwagen Sprint wieder an den Start zu gehen und in der Klasse 2 so viele Rennen zu bestreiten wie nur möglich.',
      ),
    ]),

    /* Steht im Bogen, gehoert aber nicht ungefragt auf die Seite: deshalb nur
       im Backend, bis das Team der Veroeffentlichung zustimmt. Dasselbe
       Vorgehen wie bei den anderen Teams. */
    contactName: 'Sven Ehlich',
    contactEmail: 'svehli05@gmail.com',
    contactPublic: false,

    /* Die Webseite bleibt leer: Das Team gibt ehlichmotorsport.de an, sagt
       aber selbst, sie sei „momentan im Aufbau". Ein Abruf am 07.10.2026
       scheiterte an einem TLS-Fehler, die Adresse liefert also derzeit keine
       Seite aus. Ein toter Link gehoert nicht auf die Teamseite. */

    /* Aus beiden Instagram-Adressen sind die Zaehlparameter (?stkn=) entfernt:
       Weitergabe-Kennungen aus der App, die am Ziel nichts aendern. */
    social: [
      { label: 'Instagram (Team)', url: 'https://www.instagram.com/ehlichmotorsport/' },
      { label: 'Instagram (Sven Ehlich)', url: 'https://www.instagram.com/sven_ehlich_/' },
    ],

    vehicles: [
      {
        manufacturer: 'Radical',
        model: 'SR3 Supersport',
        year: '2006',
        engine: '4-Zylinder, 1,5 l Hayabusa, 250 PS, 600 kg',
        modifications:
          'Der Radical SR3 wird von uns stetig optimiert, um noch mehr Gewicht und Leistung herauszubekommen.',
        /* HIER FEHLT DIE BATTERIE. Der Bogen nennt kein Modell, deshalb bleiben
           `battery` und `batteryOther` leer. Bitte nicht auf Verdacht fuellen. */
        reason: 'Wir haben uns für Bulltron entschieden, da die Preis-Leistung uns bisher am besten anspricht.',
        photo: await medium('strecke'),
      },
      {
        manufacturer: 'Ford',
        model: 'Focus ST Mk2',
        year: '2005',
        engine:
          '5-Zylinder, 2,5 l Turbo, 480 PS, 1.160 kg (Angaben des Teams, die sich im Aufbau stetig verändern)',
        modifications:
          'Noch im Aufbau. Geplant sind Käfig, Verbreiterung, Leistungssteigerung, Fahrwerk sowie Aerodynamik an Heck und Front.',
      },
    ],

    /* Die beiden Termine sind am 07.10.2026 auf oldtimertrackdays.de bestaetigt
       worden: der 25.10. am Nuerburgring und der 07.11. am Bilster Berg. */
    upcoming: [
      {
        date: '2026-10-25',
        event: 'Oldtimer Trackday, Familientag — Radical SR3 als Race Taxi',
        track: 'Nürburgring',
        url: 'https://www.oldtimertrackdays.de/',
      },
      {
        date: '2026-11-07',
        event: 'Oldtimer Trackday — Radical SR3 als Race Taxi',
        track: 'Bilster Berg',
        url: 'https://www.oldtimertrackdays.de/',
      },
    ],

    mainImage: await medium('strecke'),
    gallery: [{ image: await medium('kurve') }, { image: await medium('werkstatt') }],

    internalNote: [
      'Angelegt am 07.10.2026 aus dem ausgefuellten Fragebogen "Ehlich Motorsport.docx".',
      '',
      'STEHT AUF NICHT VEROEFFENTLICHT. Zwei Gruende, beide vor der Freischaltung zu klaeren:',
      '',
      '1. DAS BATTERIEMODELL FEHLT. Auf die Frage nach dem eingesetzten Bulltron-Modell hat das Team nur geantwortet, warum es sich fuer Bulltron entschieden hat ("da die Preis-Leistung uns bisher am besten anspricht"). Welche Batterie im Radical steckt, steht nirgends. Beide Batteriefelder sind deshalb leer und die Seite verlinkt auf kein Produkt -- damit fehlt genau der Punkt, um den es bei den Teamseiten geht.',
      '',
      '2. KEINE EINWILLIGUNG ZUR BILDNUTZUNG. Der Bogen enthaelt anders als der von Schmechel Race Tech keinen Satz zur Bildfreigabe. Auf dem Werkstattbild sind zwei Personen erkennbar. Bitte die schriftliche Freigabe einholen.',
      '',
      'Weiter nachzufragen:',
      '- Die Namen der beiden Veranstaltungen vom 11.04.2026 und vom 11.-13.09.2026. Ohne Namen kann kein Eintrag unter "Ergebnisse" stehen, das Feld verlangt einen. Die beiden Einsaetze sind deshalb im Vorstellungstext beschrieben, mit den Worten des Teams.',
      '- Termine der Saison 2027 im Sportwagen Sprint (sportwagen-sprint.de). Im Bogen angekuendigt, ohne Datum.',
      '- Seit wann die Batterie im Einsatz ist, und Erfahrungen damit im Rennbetrieb. Beides nicht genannt.',
      '- Ein Teamlogo. Nicht geliefert.',
      '- Ein Foto von Sven Ehlich fuer das Fahrerfeld. Nicht geliefert; auf dem Werkstattbild sind Personen zu sehen, wer davon Sven Ehlich ist, geht aus dem Bogen nicht hervor und wird deshalb nicht behauptet.',
      '',
      'Webseite: Das Team gibt ehlichmotorsport.de an, sagt aber selbst, sie sei "momentan im Aufbau". Ein Abruf am 07.10.2026 scheiterte an einem TLS-Fehler, die Adresse liefert derzeit keine Seite aus. Das Feld bleibt leer, bis die Seite steht.',
      '',
      'Zu den Bildern:',
      '- Geliefert wurden genau drei Dateien, alle klein: zwei mit 640 x 428 Pixeln (Strecke, Kurvenausgang) und eine mit 480 x 640 (Werkstatt). Zum Vergleich: bei den anderen Teams liegen die Bilder bei 1500 bis 2000 Pixeln. Hochgerechnet wurde nichts -- das wuerde Schaerfe erfinden, die nicht da ist. Das Hauptbild wird auf grossen Bildschirmen sichtbar weich wirken. Fuer Druck reicht keines der drei: 640 Pixel sind bei 300 dpi rund 5 cm.',
      '- Bitte die Originale nachfordern.',
      '',
      'Fahrzeuge: Zwei Eintraege. Der Ford Focus ST Mk2 ist laut Bogen "noch im Aufbau" und hat deshalb weder Batterie noch Foto.',
    ].join('\n'),
  } as never,
})

payload.logger.info(
  `Team „Ehlich Motorsport" angelegt (ID ${team.id}): ein Fahrer, zwei Fahrzeuge, zwei Links, zwei Termine, drei Bilder.`,
)
payload.logger.warn(
  'NICHT VEROEFFENTLICHT: Es fehlen das Batteriemodell und die Einwilligung zur Bildnutzung. Beides steht in der internen Notiz.',
)
process.exit(0)
