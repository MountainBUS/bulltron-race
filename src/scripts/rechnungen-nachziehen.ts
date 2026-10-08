/**
 * Erzeugt Rechnungen zu bezahlten Bestellungen, bei denen keine entstanden ist.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/rechnungen-nachziehen.ts
 *
 * WOZU: Die Rechnung entsteht im Stripe-Webhook, gleich nach der Bestellung.
 * Scheitert dort die PDF-Erzeugung, bleibt die Bestellung erhalten und die Mail
 * geht ohne Anhang raus — die Rechnung fehlt aber, und bisher gab es keinen Weg
 * zurück. Im Backend lässt sie sich nicht von Hand anlegen: Nummer, Jahr und
 * laufende Nummer sind Pflichtfelder und zugleich schreibgeschützt, und das aus
 * gutem Grund.
 *
 * Eine Lücke im Nummernkreis entsteht dabei nicht: Die Nummer wird erst mit dem
 * erfolgreichen Speichern vergeben, ein gescheiterter Versuch verbraucht keine.
 * Die nachgezogene Rechnung bekommt also die nächste freie Nummer und trägt das
 * heutige Datum — nicht das der Bestellung. Wer das anders braucht, muss es von
 * Hand richten; stillschweigend rückdatieren tut dieses Skript nicht.
 *
 * MEHRFACH AUSFÜHRBAR: Bestellungen mit Rechnung werden übersprungen.
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { rechnungZurBestellung } from '../lib/rechnung-erzeugen'

const payload = await getPayload({ config })

const einstellungen = (await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })) as Record<string, any>

const bestellungen = await payload.find({
  collection: 'orders',
  where: { status: { not_equals: 'cancelled' } },
  limit: 500,
  depth: 0,
  overrideAccess: true,
})

const erzeugt: string[] = []
const schonDa: string[] = []
const fehler: string[] = []

for (const bestellung of bestellungen.docs as Record<string, any>[]) {
  const vorhanden = await payload.find({
    collection: 'invoices',
    where: { order: { equals: bestellung.id }, kind: { equals: 'invoice' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (vorhanden.docs[0]) {
    schonDa.push(String(bestellung.orderNumber ?? bestellung.id))
    continue
  }
  try {
    const { rechnung } = await rechnungZurBestellung(payload, bestellung, einstellungen)
    erzeugt.push(`${bestellung.orderNumber ?? bestellung.id} → ${rechnung.invoiceNumber}`)
  } catch (e) {
    fehler.push(`${bestellung.orderNumber ?? bestellung.id}: ${e instanceof Error ? e.message : 'unbekannt'}`)
  }
}

payload.logger.info(`Bestellungen geprüft: ${bestellungen.docs.length}`)
payload.logger.info(`Mit Rechnung, übersprungen: ${schonDa.length}`)
if (erzeugt.length === 0) payload.logger.info('Nichts nachzuziehen.')
else {
  payload.logger.info(`Nachgezogen (${erzeugt.length}):`)
  for (const z of erzeugt) payload.logger.info('  - ' + z)
}
for (const z of fehler) payload.logger.error('Fehlgeschlagen: ' + z)
process.exit(0)
