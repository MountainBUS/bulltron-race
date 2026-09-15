/**
 * Trägt die Versandkosten auf einer bereits laufenden Instanz ein.
 *
 * 17,90 € ist der von Bulltron genannte Standardsatz für den Versand als
 * Gefahrgut. Vorher standen dort 6,90 € und eine Freigrenze von 250 € — beides
 * hatte ich mir ausgedacht, nicht Bulltron. Die Freigrenze wird deshalb auf 0
 * gesetzt, also „nie versandkostenfrei": eine Freigrenze ist eine Zusage an den
 * Kunden und darf nicht aus einem Vorgabewert entstehen.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/versandkosten.ts
 *
 * Mehrfach ausführbar. Weicht der gespeicherte Wert von beiden Ständen ab, hat
 * ihn jemand von Hand gesetzt — dann bleibt er unangetastet.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const NEU = 17.9
const ALTER_VORGABEWERT = 6.9

const payload = await getPayload({ config })
const einstellungen = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as Record<string, any>

const bisher = typeof einstellungen.shippingCost === 'number' ? einstellungen.shippingCost : null
const freigrenze = typeof einstellungen.freeShippingFrom === 'number' ? einstellungen.freeShippingFrom : 0

if (bisher !== null && bisher !== ALTER_VORGABEWERT && bisher !== NEU) {
  payload.logger.warn(
    `Versandkosten stehen auf ${bisher} € — weder der alte Vorgabewert noch 17,90 €. Vermutlich von Hand gesetzt, es wird nichts geändert.`,
  )
  process.exit(0)
}

if (bisher === NEU && freigrenze === 0) {
  payload.logger.info('Versandkosten stehen bereits auf 17,90 € ohne Freigrenze — nichts zu tun.')
  process.exit(0)
}

await payload.updateGlobal({
  slug: 'site-settings',
  overrideAccess: true,
  data: { shippingCost: NEU, freeShippingFrom: 0 } as never,
})

payload.logger.info(`Versandkosten: ${bisher ?? 'leer'} € -> ${NEU} €, Freigrenze ${freigrenze} € -> 0 € (nie versandfrei).`)
process.exit(0)
