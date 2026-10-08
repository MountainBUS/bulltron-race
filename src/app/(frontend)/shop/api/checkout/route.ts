import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getPayloadClient, getSiteSettings } from '../../../../../lib/payload'
import { getStripe, isStripeConfigured } from '../../../../../lib/stripe'
import { calculateShipping } from '../../../../../lib/shipping'
import { toCents } from '../../../../../lib/format'
import { mediaUrl } from '../../../../../lib/media'
import { codeNormalisieren, gutscheinGilt, gutscheinPruefen } from '../../../../../lib/gutschein'
import type { GutscheinDaten } from '../../../../../lib/gutschein'
import { warenkorbAusDatenbank } from '../../../../../lib/warenkorb'

export const dynamic = 'force-dynamic'

type IncomingItem = { id: string | number; quantity: number }

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Der Shop ist noch nicht mit Stripe verbunden. Bitte STRIPE_SECRET_KEY in der .env hinterlegen.' },
      { status: 503 },
    )
  }

  let body: { items?: IncomingItem[]; gutschein?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const incoming = (body.items ?? []).filter((item) => item && Number(item.quantity) > 0)
  if (incoming.length === 0) {
    return NextResponse.json({ error: 'Der Warenkorb ist leer.' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  const settings = await getSiteSettings()
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || new URL(request.url).origin

  // Preise IMMER serverseitig aus der Datenbank holen — Client-Angaben werden ignoriert.
  const products = await payload.find({
    collection: 'products',
    where: {
      id: { in: incoming.map((item) => item.id) },
      status: { equals: 'published' },
    },
    limit: 100,
    depth: 1,
  })

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  let subtotal = 0

  for (const entry of incoming) {
    const product = products.docs.find((doc) => String(doc.id) === String(entry.id))
    if (!product) continue
    if (product.availability === 'sold_out') {
      return NextResponse.json({ error: `„${product.title}“ ist derzeit nicht verfügbar.` }, { status: 409 })
    }

    const quantity = Math.min(Math.max(Math.round(Number(entry.quantity)), 1), 99)
    const image = mediaUrl(product.mainImage, 'card')
    subtotal += product.price * quantity

    lineItems.push({
      quantity,
      price_data: {
        currency: 'eur',
        unit_amount: toCents(product.price),
        product_data: {
          name: product.title,
          description: product.subtitle || product.shortDescription || undefined,
          images: image && image.startsWith('http') ? [image] : image ? [`${baseUrl}${image}`] : undefined,
          metadata: { productId: String(product.id), sku: product.sku ?? '' },
        },
      },
    })
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'Keiner der Artikel ist noch verfügbar.' }, { status: 409 })
  }

  /* --- Gutschein ----------------------------------------------------------
     NOCH EINMAL PRÜFEN, nicht dem Browser glauben: Aus dem Warenkorb kommt nur
     der Code. Betrag, Bedingungen und Gültigkeit entscheiden sich hier, mit den
     Preisen aus der Datenbank und derselben Funktion, die auch die Anzeige im
     Warenkorb gefüttert hat.

     Greift der Code inzwischen nicht mehr — abgelaufen, ausgeschöpft,
     Warenkorb geändert —, wird die Bestellung abgelehnt statt still ohne
     Rabatt durchgewunken. Sonst zahlte jemand mehr, als er eben noch gesehen
     hat. */
  const gutscheinCode = codeNormalisieren(body.gutschein)
  let rabattCent = 0
  let versandfrei = false

  if (gutscheinCode) {
    const treffer = await payload.find({
      collection: 'coupons',
      where: { code: { equals: gutscheinCode } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const gutschein = treffer.docs[0] as unknown as GutscheinDaten | undefined
    if (!gutschein) {
      return NextResponse.json({ error: 'Der hinterlegte Gutscheincode gilt nicht mehr.' }, { status: 409 })
    }
    const artikel = await warenkorbAusDatenbank(payload, incoming)
    const ergebnis = gutscheinPruefen(gutschein, artikel)
    if (!gutscheinGilt(ergebnis)) {
      return NextResponse.json({ error: ergebnis.grund }, { status: 409 })
    }
    rabattCent = ergebnis.rabattCent
    versandfrei = ergebnis.versandfrei
  }

  const shipping = versandfrei
    ? 0
    : calculateShipping(subtotal, {
        shippingCost: settings.shippingCost,
        freeShippingFrom: settings.freeShippingFrom,
      })

  /* Stripe nimmt im Zahlungsmodus keine Sitzung über null Euro an. Ein Code,
     der zusammen mit dem Versand auf genau null führt, würde dort mit einer
     englischen Fehlermeldung abbrechen — hier gibt es stattdessen einen Satz,
     mit dem der Kunde etwas anfangen kann. */
  if (toCents(subtotal) - rabattCent + toCents(shipping) <= 0) {
    return NextResponse.json(
      { error: 'Mit diesem Gutschein bleibt kein zu zahlender Betrag übrig. Bitte wende dich an uns, wir legen die Bestellung von Hand an.' },
      { status: 409 },
    )
  }

  const tageMin = Number(settings.deliveryDaysMin ?? 0)
  const tageMax = Number(settings.deliveryDaysMax ?? 0)
  const lieferzeit =
    tageMin > 0 && tageMax >= tageMin
      ? {
          minimum: { unit: 'business_day' as const, value: tageMin },
          maximum: { unit: 'business_day' as const, value: tageMax },
        }
      : null

  const allowedCountries = (settings.shippingCountries ?? [])
    .map((country) => country.code?.toUpperCase())
    .filter((code): code is Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry =>
      Boolean(code && code.length === 2),
    )

  try {
    const stripe = getStripe()

    /* Der Rabatt geht als eigener Stripe-Gutschein in die Sitzung, nicht als
       negative Position: Nur so steht er auf der Bezahlseite, auf dem Beleg und
       im Payment Intent als Rabatt — und die Summen stimmen überall überein.

       IMMER ALS BETRAG, nie als Prozentsatz. Ein Prozentsatz würde bei Stripe
       auf alle Positionen wirken; bei einem Code, der nur für bestimmte
       Produkte gilt, wäre das zu viel. Gerechnet hat ohnehin schon diese Seite.

       Der Gutschein ist einmalig und verfällt nach einem Tag, damit im
       Stripe-Konto keine Halde entsteht und eine abgefangene Kennung nicht
       dauerhaft brauchbar bleibt. */
    const rabatt =
      rabattCent > 0
        ? await stripe.coupons.create({
            amount_off: rabattCent,
            currency: 'eur',
            duration: 'once',
            name: `Gutschein ${gutscheinCode}`,
            max_redemptions: 1,
            redeem_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
            metadata: { code: gutscheinCode, source: 'bulltron-race' },
          })
        : null

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'de',
      line_items: lineItems,
      success_url: `${baseUrl}/bestellung?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/warenkorb?abbruch=1`,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: allowedCountries.length > 0 ? allowedCountries : ['DE', 'AT', 'CH'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: shipping === 0 ? 'Versandkostenfrei' : 'Versand',
            fixed_amount: { amount: toCents(shipping), currency: 'eur' },
            /* Die Lieferzeit steht auf der Stripe-Bezahlseite und ist damit eine
               Zusage an den Kunden. Sie wird nur mitgeschickt, wenn sie im
               Backend gepflegt ist — sonst sagt die Seite dazu nichts. */
            ...(lieferzeit ? { delivery_estimate: lieferzeit } : {}),
          },
        },
      ],
      ...(rabatt ? { discounts: [{ coupon: rabatt.id }] } : {}),
      metadata: {
        source: 'bulltron-race',
        itemCount: String(lineItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0)),
        /* Der Webhook liest den Code von hier und zählt die Einlösung hoch.
           Er rechnet nicht noch einmal — gezahlt ist, was Stripe abgerechnet
           hat, und das steht in den Beträgen der Sitzung. */
        ...(gutscheinCode ? { couponCode: gutscheinCode } : {}),
      },
    })

    return NextResponse.json({ url: session.url, id: session.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler bei Stripe.'
    return NextResponse.json({ error: `Stripe: ${message}` }, { status: 502 })
  }
}
