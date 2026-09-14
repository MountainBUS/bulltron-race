/**
 * Löscht die Lieferzeit „2–4 Werktage" aus den Produkten.
 *
 * Diese Angabe stammte aus einem Vorgabewert am Feld und nicht von Bulltron.
 * Sie steht auf der Produktseite und ist damit eine Zusage an den Kunden,
 * während alle Produkte zugleich auf „Lieferzeit auf Anfrage" stehen. Der
 * Vorgabewert ist entfernt; dieses Skript räumt die Werte auf, die vorher
 * schon in der Datenbank gelandet sind.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/lieferzeit-leeren.ts
 *
 * Angepasste Lieferzeiten bleiben stehen: geleert wird nur, was exakt dem
 * alten Vorgabewert entspricht. Mehrfach ausführbar.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const VORGABE = ['2–4 Werktage', '2-4 Werktage']

const payload = await getPayload({ config })

const produkte = await payload.find({ collection: 'products', limit: 500, depth: 0, overrideAccess: true })

let geleert = 0
for (const produkt of produkte.docs as Array<Record<string, any>>) {
  const wert = String(produkt.deliveryTime ?? '').trim()
  if (!VORGABE.includes(wert)) continue
  await payload.update({
    collection: 'products',
    id: produkt.id,
    overrideAccess: true,
    data: { deliveryTime: null } as never,
  })
  payload.logger.info(`${produkt.title}: Lieferzeit „${wert}" entfernt`)
  geleert++
}

payload.logger.info(`Fertig — ${geleert} von ${produkte.docs.length} Produkten bereinigt.`)
process.exit(0)
