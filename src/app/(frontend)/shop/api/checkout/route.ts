import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getPayloadClient, getSiteSettings } from '../../../../../lib/payload'
import { getStripe, isStripeConfigured } from '../../../../../lib/stripe'
import { calculateShipping } from '../../../../../lib/shipping'
import { toCents } from '../../../../../lib/format'
import { mediaUrl } from '../../../../../lib/media'

export const dynamic = 'force-dynamic'

type IncomingItem = { id: string | number; quantity: number }

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Der Shop ist noch nicht mit Stripe verbunden. Bitte STRIPE_SECRET_KEY in der .env hinterlegen.' },
      { status: 503 },
    )
  }

  let body: { items?: IncomingItem[] }
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

  const shipping = calculateShipping(subtotal, {
    shippingCost: settings.shippingCost,
    freeShippingFrom: settings.freeShippingFrom,
  })

  const allowedCountries = (settings.shippingCountries ?? [])
    .map((country) => country.code?.toUpperCase())
    .filter((code): code is Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry =>
      Boolean(code && code.length === 2),
    )

  try {
    const stripe = getStripe()
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
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 4 },
            },
          },
        },
      ],
      metadata: {
        source: 'bulltron-race',
        itemCount: String(lineItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0)),
      },
    })

    return NextResponse.json({ url: session.url, id: session.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler bei Stripe.'
    return NextResponse.json({ error: `Stripe: ${message}` }, { status: 502 })
  }
}
