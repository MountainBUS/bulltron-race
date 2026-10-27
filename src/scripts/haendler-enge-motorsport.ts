/**
 * Legt Enge Motorsport als Händler an — auf einer bereits laufenden Instanz.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/haendler-enge-motorsport.ts
 *
 * Mehrfach ausführbar: Gibt es den Eintrag schon, passiert nichts.
 *
 * QUELLEN:
 *   - Visitenkarte, von Marco am 27.10.2026 übergeben: Name, Ansprechpartner,
 *     Anschrift, Telefon, E-Mail, Webadresse, Instagram, Facebook.
 *   - enge-motorsport.de, abgerufen am 27.10.2026: „Kontakt" für die
 *     Öffnungszeiten, „Über uns" für die Kurzbeschreibung, „Impressum" für
 *     die Firmierung.
 *
 * TELEFONNUMMER in internationaler Schreibweise. Auf der Visitenkarte steht
 * „(+49) 0177/5286861" — die Null nach der Ländervorwahl gehört dort nicht
 * hin, international ist es +49 177 5286861. Innerhalb Deutschlands bleibt
 * 0177 5286861 richtig.
 *
 * NUR „WERKSTATT" BEI DEN LEISTUNGEN: Dass es eine Werkstatt ist, steht auf
 * der Seite. Ob Enge Motorsport Bulltron-Batterien auch einbaut, berät oder
 * zur Abholung vorhält, steht nirgends — das muss Julian Enge selbst sagen.
 * Die übrigen Haken gehören deshalb im Backend gesetzt, nicht hier geraten.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const NAME = 'Enge Motorsport'

const payload = await getPayload({ config })

const vorhanden = await payload.find({
  collection: 'dealers',
  where: { name: { equals: NAME } },
  limit: 1,
  overrideAccess: true,
})
if (vorhanden.docs.length > 0) {
  payload.logger.info(`„${NAME}" steht bereits im Backend — es wird nichts geändert.`)
  process.exit(0)
}

const haendler = await payload.create({
  collection: 'dealers',
  overrideAccess: true,
  data: {
    name: NAME,
    published: true,
    status: ['haendler'],

    street: 'Max-Eyth-Straße 57a',
    postalCode: '46149',
    city: 'Oberhausen',
    country: 'DE',

    contactPerson: 'Julian Enge',
    email: 'info@enge-motorsport.de',
    phone: '+49 177 5286861',
    website: 'https://www.enge-motorsport.de',
    openingHours: ['Montag bis Freitag 08:00 - 17:00 Uhr', 'Samstag und Sonntag geschlossen'].join('\n'),

    services: ['werkstatt'],

    description:
      'Unabhängige Porsche-Werkstatt in Oberhausen, geführt von Kfz-Technikermeister Julian Enge. Schwerpunkte sind Service, Wartung und Reparatur sowie Motor- und Getrieberevision, dazu Karosserie- und Unfallinstandsetzung und individuelle Umbauten. Motorsportfahrzeuge werden auch auf Rennstrecken in Europa betreut.',

    internalNote: [
      'Angelegt am 27.10.2026 nach der Visitenkarte von Julian Enge und den Angaben auf enge-motorsport.de.',
      '',
      'Soziale Netzwerke (die Sammlung hat dafür keine Felder, stehen auf der Visitenkarte):',
      '- Instagram: enge_motorsport',
      '- Facebook: Enge Motorsport',
      '',
      'Nachzufragen:',
      '- Welche Leistungen rund um die Batterien angeboten werden. Eingetragen ist nur „Werkstatt", weil nur das belegt ist. Einbau, Beratung, Abholung und Vor-Ort-Service bitte nach Rücksprache im Backend ergänzen.',
      '- Logo für den Eintrag.',
      '- Ob der Name als „Enge Motorsport" oder als „ENGE MOTORSPORT" stehen soll. Das Impressum und die Visitenkarte schreiben ihn in Großbuchstaben, die Seitentitel und die Facebook-Seite gemischt.',
      '',
      'Die Kurzbeschreibung ist meine Zusammenfassung der Seite „Über uns", kein Zitat.',
      '',
      'Nicht übernommen: Die Seite „Über uns" nennt zwei verschiedene Gründungszeitpunkte — „Anfang 2024" und „Seit dem 01.01.2026 führe ich meine eigene Werkstatt". Solange der Widerspruch nicht geklärt ist, steht kein Gründungsjahr im Eintrag.',
      '',
      'USt-IdNr. laut Impressum: DE 365 327 714.',
    ].join('\n'),
  } as never,
})

const gespeichert = (await payload.findByID({
  collection: 'dealers',
  id: haendler.id,
  depth: 0,
  overrideAccess: true,
})) as Record<string, any>

payload.logger.info(`Händler „${NAME}" angelegt (ID ${haendler.id}, Adresse /haendler, Slug ${gespeichert.slug}).`)

/* Ohne Koordinaten taucht der Eintrag in der Umkreissuche nicht auf und fehlt
   auf der Karte — deshalb hier nachsehen statt hoffen. */
const koordinaten = gespeichert.coordinates ?? {}
if (typeof koordinaten.lat === 'number' && typeof koordinaten.lng === 'number') {
  payload.logger.info(`Koordinaten aus der Postleitzahl: ${koordinaten.lat}, ${koordinaten.lng}`)
} else {
  payload.logger.error(
    'Keine Koordinaten ermittelt — der Eintrag erscheint nicht in der Umkreissuche. Bitte im Backend von Hand setzen.',
  )
  process.exit(1)
}

process.exit(0)
