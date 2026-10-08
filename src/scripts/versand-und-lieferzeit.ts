/**
 * Setzt die Versandländer auf Deutschland und die Lieferzeit auf 2 bis 4
 * Werktage.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/versand-und-lieferzeit.ts
 *
 * Marco am 08.10.2026: Nach Österreich und in die Schweiz wird nur direkt an
 * Händler verkauft, nicht über diesen Shop. Das muss auch in den Daten stehen,
 * nicht nur im Code — sonst kann weiterhin jemand dorthin bestellen, und die
 * Rechnung wiese 19 Prozent deutsche Umsatzsteuer auf eine Lieferung aus, für
 * die sie nicht gilt.
 *
 * Die Lieferzeit erscheint auf der Stripe-Bezahlseite und ist damit eine Zusage
 * an den Kunden; 2 bis 4 Werktage hat Marco am selben Tag genannt.
 *
 * MEHRFACH AUSFÜHRBAR. Das Skript meldet, was es vorgefunden hat.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })

const einstellungen = (await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })) as Record<string, any>

const vorher = (einstellungen.shippingCountries ?? []).map((l: any) => l?.code).filter(Boolean)
payload.logger.info(`Versandländer bisher: ${vorher.join(', ') || 'keine'}`)
payload.logger.info(`Lieferzeit bisher: ${einstellungen.deliveryDaysMin ?? '—'} bis ${einstellungen.deliveryDaysMax ?? '—'} Werktage`)

await payload.updateGlobal({
  slug: 'site-settings',
  data: {
    shippingCountries: [{ code: 'DE', name: 'Deutschland' }],
    deliveryDaysMin: 2,
    deliveryDaysMax: 4,
  } as never,
  overrideAccess: true,
})

const danach = (await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })) as Record<string, any>
payload.logger.info(
  `Jetzt: ${(danach.shippingCountries ?? []).map((l: any) => l?.code).join(', ')}, ` +
    `${danach.deliveryDaysMin} bis ${danach.deliveryDaysMax} Werktage.`,
)

/* Offene Bestellungen in andere Länder gäbe es nur, wenn vorher dorthin
   verkauft wurde — danach sehen, statt es zu behaupten. */
const fremde = await payload.find({
  collection: 'orders',
  where: { 'shippingAddress.country': { not_equals: 'DE' } },
  limit: 20,
  depth: 0,
  overrideAccess: true,
})
if (fremde.totalDocs > 0) {
  payload.logger.warn(
    `ACHTUNG: ${fremde.totalDocs} Bestellung(en) mit einer Lieferadresse außerhalb Deutschlands: ` +
      fremde.docs.map((b: any) => b.orderNumber ?? b.id).join(', '),
  )
} else {
  payload.logger.info('Keine Bestellung mit Lieferadresse außerhalb Deutschlands.')
}
process.exit(0)
