import type { Payload } from 'payload'
import { toCents } from './format'
import type { GutscheinArtikel } from './gutschein'

export type WarenkorbEingang = { id: string | number; quantity: number }

/**
 * Baut aus den gemeldeten Positionen den Warenkorb, wie der Server ihn sieht.
 *
 * Der Warenkorb lebt im Browser, die Preise kommen trotzdem aus der Datenbank:
 * Geschickt wird nur, welches Produkt in welcher Menge. Was der Browser über
 * Preise behauptet, wird nirgends gelesen.
 *
 * AN EINER STELLE, weil Prüfroute und Kasse dieselbe Sicht brauchen. Rechneten
 * sie unterschiedlich, zeigte der Warenkorb einen anderen Rabatt an, als die
 * Bezahlseite abrechnet.
 *
 * Ausverkaufte Artikel fallen hier heraus. Die Kassenroute lehnt sie darüber
 * hinaus mit einer eigenen Meldung ab — beim Prüfen eines Gutscheins wäre eine
 * solche Meldung dagegen verwirrend, weil sie mit dem Code nichts zu tun hat.
 */
export const warenkorbAusDatenbank = async (
  payload: Payload,
  eingang: WarenkorbEingang[],
): Promise<GutscheinArtikel[]> => {
  const produkte = await payload.find({
    collection: 'products',
    where: { id: { in: eingang.map((item) => item.id) }, status: { equals: 'published' } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const artikel: GutscheinArtikel[] = []
  for (const eintrag of eingang) {
    const produkt = produkte.docs.find((doc) => String(doc.id) === String(eintrag.id)) as Record<string, any> | undefined
    if (!produkt) continue
    if (produkt.availability === 'sold_out') continue
    artikel.push({
      id: produkt.id,
      preisCent: toCents(Number(produkt.price) || 0),
      menge: Math.min(Math.max(Math.round(Number(eintrag.quantity)), 1), 99),
      /* depth 0 liefert die Kategorien als IDs — genau das, was die Prüfung
         braucht, und eine Abfrage weniger. */
      kategorieIds: Array.isArray(produkt.category) ? produkt.category : produkt.category ? [produkt.category] : [],
    })
  }
  return artikel
}
