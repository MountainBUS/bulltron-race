/**
 * Legt die Garage S. Kronwald GmbH als Händler an — auf einer bereits
 * laufenden Instanz.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/haendler-kronwald.ts
 *
 * Mehrfach ausführbar: Gibt es den Eintrag schon, passiert nichts.
 *
 * QUELLE: garage-kronwald.ch, abgerufen am 10.11.2026 — Startseite für
 * Anschrift, Telefon, E-Mail und Öffnungszeiten, „Impressum" für die
 * Firmierung und den Vertretungsberechtigten, „BULLTRON Batterien" für das,
 * was der Betrieb rund um die Batterien anbietet.
 *
 * TELEFONNUMMER in internationaler Schreibweise. Auf der Seite steht
 * „071 571 48 20", im Verweis dahinter „+41 715714820". Innerhalb der Schweiz
 * bleibt die Null am Anfang richtig, von außen nicht — deshalb hier mit
 * Ländervorwahl und ohne Null.
 *
 * NUR BERATUNG UND WERKSTATT: Beides steht wörtlich auf der Seite („Partner
 * von BULLTRON und berät Sie persönlich", „Beratung vor Ort"; dazu die
 * Werkstattleistungen Service, Reparatur, Diagnose, Reifen, Bremsen, MFK).
 * Vom Einbau der Batterien steht dort nichts. Zum Kauf heißt es nur, man
 * könne das Modell „direkt bei uns beziehen" — das klingt nach Abholung, sagt
 * es aber nicht. Beide Haken gehören deshalb erst nach Rücksprache gesetzt.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const NAME = 'Garage S. Kronwald GmbH'

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

    street: 'Werkstrasse 1',
    postalCode: '8362',
    city: 'Balterswil',
    country: 'CH',

    contactPerson: 'Sebastian Kronwald',
    email: 'info@garage-kronwald.ch',
    phone: '+41 71 571 48 20',
    website: 'https://garage-kronwald.ch',
    openingHours: [
      'Montag bis Freitag 08:00 - 12:00 und 13:30 - 18:00 Uhr',
      'Samstag nach Vereinbarung',
      'Sonntag geschlossen',
    ].join('\n'),

    services: ['beratung', 'werkstatt'],

    description:
      'Garage in Balterswil im Kanton Thurgau: Service und Wartung, Reparaturen, Fahrzeugdiagnose, Reifen, Bremsen und Fahrwerk sowie die Vorbereitung auf die Motorfahrzeugkontrolle. Für Bulltron-Race-Batterien berät der Betrieb persönlich vor Ort.',

    internalNote: [
      'Angelegt am 10.11.2026 nach den Angaben auf garage-kronwald.ch (Startseite, Impressum, Unterseite „BULLTRON Batterien").',
      '',
      'Firmierung laut Impressum: Garage S. Kronwald GmbH, vertretungsberechtigt Sebastian Kronwald.',
      'Handelsregister CH-440.4.041.744-5, UID CHE-247.510.249.',
      '',
      'Zweite E-Mail-Adresse auf der Seite: skronwald@garage-kronwald.ch. Öffentlich steht die allgemeine info@-Adresse.',
      '',
      'Nachzufragen:',
      '- Bauen sie die Batterien auch ein? Auf der Seite steht nichts davon, deshalb ist der Haken „Einbau" nicht gesetzt.',
      '- Können Kunden Batterien dort abholen? Auf der Unterseite steht nur, man könne das Modell „direkt bei uns beziehen". Das klingt nach Abholung, sagt es aber nicht — Haken „Abholung möglich" deshalb offen.',
      '- Logo für den Eintrag.',
      '',
      'Die Kurzbeschreibung ist meine Zusammenfassung der Leistungsübersicht, kein Zitat.',
      '',
      'Auf ihrer Unterseite listen sie dreizehn Ausführungen von 4 bis 55 Ah. Die 118 Ah fehlt dort — falls sie die mitführen sollen, wäre das ein Hinweis wert.',
    ].join('\n'),
  } as never,
})

const gespeichert = (await payload.findByID({
  collection: 'dealers',
  id: haendler.id,
  depth: 0,
  overrideAccess: true,
})) as Record<string, any>

payload.logger.info(`Händler „${NAME}" angelegt (ID ${haendler.id}, Slug ${gespeichert.slug}).`)

/* Ohne Koordinaten fehlt der Eintrag in der Umkreissuche und auf der Karte.
   Die Postleitzahlentabelle deckt die Schweiz ab — nachsehen statt hoffen. */
const koordinaten = gespeichert.coordinates ?? {}
if (typeof koordinaten.lat === 'number' && typeof koordinaten.lng === 'number') {
  payload.logger.info(`Koordinaten aus der Postleitzahl 8362: ${koordinaten.lat}, ${koordinaten.lng}`)
} else {
  payload.logger.error(
    'Keine Koordinaten ermittelt — der Eintrag erscheint nicht in der Umkreissuche. Bitte im Backend von Hand setzen.',
  )
  process.exit(1)
}

process.exit(0)
