/**
 * Rendert die Bestellbestätigung als HTML-Datei, damit sich das Aussehen ohne
 * Versand beurteilen lässt.
 *
 *   node_modules/.bin/tsx scripts/mail-vorschau.mts
 *
 * In der Mail sitzen die Bilder als Anhang mit Content-ID. Im Browser gibt es
 * keine Anhänge, deshalb ersetzt dieses Skript jede `cid:`-Adresse durch eine
 * eingebettete Data-URL. Der Rest ist unverändert derselbe Code wie im Versand.
 */
import fs from 'fs/promises'
import path from 'path'
import { kundenHtml, shopHtml, logoAnhang, bildAnhang } from '../src/lib/mail'

const assets = path.join(process.cwd(), 'src', 'seed', 'assets')

const bestellung = {
  orderNumber: 'BR-2026-4BSLNZCR',
  email: 'kundin@example.de',
  customerName: 'Marco Steinfeld',
  phone: '+49 162 1883407',
  shippingAddress: { line1: 'Söhrestraße 7', line2: null, postalCode: '34327', city: 'Körle', country: 'DE' },
  items: [
    { product: 1, title: 'Race 4 Ah', sku: 'LI4B500-12-R1', quantity: 2, unitPrice: 199, lineTotal: 398 },
    { product: 2, title: 'Race 12 Ah', sku: 'LI12B1000-12-R', quantity: 1, unitPrice: 349, lineTotal: 349 },
  ],
  subtotal: 747,
  shipping: 17.9,
  total: 764.9,
}

const einstellungen = {
  siteName: 'BULLTRON RACE',
  companyName: 'ProVerDa GmbH',
  street: 'An der Lache 40-42',
  postalCode: '99086',
  city: 'Erfurt',
  phone: '+49 361 34948420',
  email: 'info@bulltron-race.de',
  priceNote: 'Alle Preise inkl. gesetzlicher MwSt., zzgl. Versandkosten.',
  termsUrl: '/agb',
  privacyUrl: '/datenschutz',
  imprintUrl: '/impressum',
}

const logo = await logoAnhang()
const bilder = [
  await bildAnhang(path.join(assets, 'race-4ah.webp'), 'pos-0', 176, 176, 'contain'),
  await bildAnhang(path.join(assets, 'race-12ah.webp'), 'pos-1', 176, 176, 'contain'),
]

const einbetten = (html: string): string => {
  let ergebnis = html
  for (const anhang of [logo, ...bilder]) {
    if (!anhang) continue
    ergebnis = ergebnis.replaceAll(
      `cid:${anhang.cid}`,
      `data:${anhang.contentType};base64,${anhang.content.toString('base64')}`,
    )
  }
  return ergebnis
}

const ziel = path.join(process.cwd(), 'vorschau')
await fs.mkdir(ziel, { recursive: true })

await fs.writeFile(
  path.join(ziel, 'bestellbestaetigung.html'),
  einbetten(kundenHtml(bestellung, einstellungen, 'https://dev.bulltron-race.de', logo, bilder)),
)
await fs.writeFile(
  path.join(ziel, 'shop-benachrichtigung.html'),
  einbetten(shopHtml(bestellung, einstellungen, logo, bilder)),
)

const groesse = [logo, ...bilder].reduce((summe, a) => summe + (a?.content.length ?? 0), 0)
console.log(`Vorschau geschrieben. Anhänge zusammen: ${Math.round(groesse / 1024)} KB`)
