import { NextResponse } from 'next/server'
import { getPayloadClient } from '../../../../../lib/payload'
import { codeNormalisieren, gutscheinGilt, gutscheinPruefen } from '../../../../../lib/gutschein'
import type { GutscheinDaten } from '../../../../../lib/gutschein'
import { warenkorbAusDatenbank } from '../../../../../lib/warenkorb'

export const dynamic = 'force-dynamic'

type IncomingItem = { id: string | number; quantity: number }

/**
 * Prüft einen Gutscheincode gegen den Warenkorb.
 *
 * Der Warenkorb liegt im Browser, die Preise kommen trotzdem aus der
 * Datenbank — geschickt wird nur, welches Produkt in welcher Menge. Was der
 * Browser über Preise behauptet, interessiert hier niemanden.
 *
 * Diese Antwort ist eine Anzeige, keine Zusage: Vor dem Bezahlen rechnet die
 * Kassenroute noch einmal mit derselben Funktion.
 *
 * ABSICHTLICH KARG: Es gibt keine Auskunft darüber, ob ein Code überhaupt
 * existiert — ein unbekannter und ein abgelaufener Code bekommen dieselbe
 * Antwort wie ein Code, der auf diesen Warenkorb nicht passt, soweit die
 * Begründung dem Kunden nicht weiterhilft. Sonst ließe sich die Codeliste
 * durch Ausprobieren abklopfen.
 */
export async function POST(request: Request) {
  let body: { code?: unknown; items?: IncomingItem[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const code = codeNormalisieren(body.code)
  if (!code) {
    return NextResponse.json({ error: 'Bitte einen Code eingeben.' }, { status: 400 })
  }

  const incoming = (body.items ?? []).filter((item) => item && Number(item.quantity) > 0)
  if (incoming.length === 0) {
    return NextResponse.json({ error: 'Der Warenkorb ist leer.' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  const treffer = await payload.find({
    collection: 'coupons',
    where: { code: { equals: code } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const gutschein = treffer.docs[0] as unknown as GutscheinDaten | undefined
  if (!gutschein) {
    return NextResponse.json({ error: 'Diesen Code kennen wir nicht.' }, { status: 404 })
  }

  const artikel = await warenkorbAusDatenbank(payload, incoming)
  if (artikel.length === 0) {
    return NextResponse.json({ error: 'Keiner der Artikel ist noch verfügbar.' }, { status: 409 })
  }

  const ergebnis = gutscheinPruefen(gutschein, artikel)
  if (!gutscheinGilt(ergebnis)) {
    return NextResponse.json({ error: ergebnis.grund }, { status: 409 })
  }

  return NextResponse.json({
    code: ergebnis.code,
    art: ergebnis.art,
    rabatt: ergebnis.rabattCent / 100,
    versandfrei: ergebnis.versandfrei,
    beschriftung: ergebnis.beschriftung,
  })
}
