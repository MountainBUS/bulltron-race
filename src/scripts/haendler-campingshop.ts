/**
 * Legt Campingshop.nu als Händler an — auf einer bereits laufenden Instanz.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/haendler-campingshop.ts
 *
 * Mehrfach ausführbar: Gibt es den Eintrag schon, passiert nichts.
 *
 * QUELLE der Angaben ist die Seite des Händlers selbst, abgerufen am
 * 26.09.2026: Startseite und „Om oss" für Anschrift und Kontakt,
 * „Köpvillkor" für die Firmierung.
 *
 * ZWEI ANSCHRIFTEN auf der Seite, und das ist kein Tippfehler:
 *   - Borggatan 2, 343 37 Älmhult — steht im Seitenkopf, im Fuß und auf
 *     „Om oss". Das ist die Anschrift, mit der sich der Shop nach außen zeigt,
 *     und deshalb steht sie hier.
 *   - Prismagatan 10B, 343 38 Älmhult — steht in den Köpvillkor als Sitz der
 *     Firma Vagnify.
 * Welche für den Händlereintrag gelten soll, muss beim Händler nachgefragt
 * werden.
 *
 * KOORDINATEN kommen wie bei jedem anderen Eintrag aus der Postleitzahl: Die
 * Tabelle und der Kartenausschnitt decken seit dem 26.09.2026 auch Schweden ab.
 * 343 37 liegt bei 56,55 Grad Nord und 14,14 Grad Ost.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })

const vorhanden = await payload.find({
  collection: 'dealers',
  where: { name: { equals: 'Campingshop.nu' } },
  limit: 1,
  overrideAccess: true,
})
if (vorhanden.docs.length > 0) {
  payload.logger.info('Campingshop.nu steht bereits im Backend — es wird nichts geändert.')
  process.exit(0)
}

const haendler = await payload.create({
  collection: 'dealers',
  overrideAccess: true,
  data: {
    name: 'Campingshop.nu',
    published: true,
    status: ['haendler'],
    statusFreitext: 'Händler für Schweden',

    street: 'Borggatan 2',
    postalCode: '343 37',
    city: 'Älmhult',
    country: 'SE',

    contactPerson: 'Daniela und Christian',
    email: 'info@campingshop.nu',
    phone: '+46 76 428 03 21',
    website: 'https://campingshop.nu',

    description:
      'Onlineshop für Camping- und Freizeitzubehör für Wohnmobil, Van und Zelt, geführt von Daniela und Christian in Älmhult.',

    internalNote: [
      'Angelegt am 26.09.2026 aus den Angaben auf campingshop.nu (Startseite, „Om oss", „Köpvillkor").',
      '',
      'Nachzufragen:',
      '- Welche Anschrift soll öffentlich stehen? Die Seite nennt zwei: Borggatan 2, 343 37 Älmhult (Kopf, Fuß, „Om oss" — hier eingetragen) und Prismagatan 10B, 343 38 Älmhult (Köpvillkor, Sitz der Firma Vagnify).',
      '- Nachnamen der beiden Ansprechpartner. Die Seite nennt nur „Daniela" und „Christian".',
      '- Logo für den Eintrag.',
      '',
      'Die Kurzbeschreibung ist meine Zusammenfassung der Selbstdarstellung auf „Om oss", kein Zitat. Der freie Status „Händler für Schweden" folgt dem Muster von „Händler für die Schweiz".',
    ].join('\n'),
  } as never,
})

payload.logger.info(`Händler „Campingshop.nu" angelegt (ID ${haendler.id}).`)
process.exit(0)
