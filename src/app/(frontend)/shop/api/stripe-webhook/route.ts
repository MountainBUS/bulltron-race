import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getPayloadClient } from '../../../../../lib/payload'
import { getStripe, isStripeConfigured } from '../../../../../lib/stripe'

export const dynamic = 'force-dynamic'

/**
 * Stripe-Webhook. Nur hier entstehen Bestellungen — die Signatur wird geprüft,
 * bevor irgendetwas geschrieben wird.
 *
 * Lokal testen:  stripe listen --forward-to localhost:3000/shop/api/stripe-webhook
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!isStripeConfigured() || !secret) {
    return NextResponse.json({ error: 'Stripe-Webhook ist nicht konfiguriert.' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Signatur fehlt.' }, { status: 400 })
  }

  const rawBody = await request.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unbekannt'
    return NextResponse.json({ error: `Signatur ungültig: ${message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const payload = await getPayloadClient()

  // Doppelte Webhook-Zustellungen dürfen keine zweite Bestellung erzeugen.
  const existing = await payload.find({
    collection: 'orders',
    where: { 'stripe.sessionId': { equals: session.id } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length > 0) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ['data.price.product'] })

  const items = lineItems.data.map((line) => {
    const product = line.price?.product as Stripe.Product | undefined
    const unitPrice = (line.price?.unit_amount ?? 0) / 100
    const quantity = line.quantity ?? 1
    return {
      product: product?.metadata?.productId ? Number(product.metadata.productId) : undefined,
      title: line.description ?? product?.name ?? 'Artikel',
      sku: product?.metadata?.sku || undefined,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    }
  })

  const shipping = (session.total_details?.amount_shipping ?? 0) / 100
  const total = (session.amount_total ?? 0) / 100
  const address = session.collected_information?.shipping_details?.address ?? session.customer_details?.address
  const recipient = session.collected_information?.shipping_details?.name ?? session.customer_details?.name

  try {
    await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        orderNumber: `BR-${new Date().getFullYear()}-${session.id.slice(-8).toUpperCase()}`,
        status: session.payment_status === 'paid' ? 'paid' : 'processing',
        email: session.customer_details?.email ?? undefined,
        customerName: recipient ?? undefined,
        phone: session.customer_details?.phone ?? undefined,
        shippingAddress: address
          ? {
              line1: address.line1 ?? undefined,
              line2: address.line2 ?? undefined,
              postalCode: address.postal_code ?? undefined,
              city: address.city ?? undefined,
              country: address.country ?? undefined,
            }
          : undefined,
        items,
        subtotal: total - shipping,
        shipping,
        total,
        stripe: {
          sessionId: session.id,
          paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
          paymentStatus: session.payment_status ?? undefined,
        },
      },
    })
  } catch (error) {
    // Stripe wiederholt die Zustellung, wenn wir einen Fehler melden.
    const message = error instanceof Error ? error.message : 'unbekannt'
    return NextResponse.json({ error: `Bestellung konnte nicht gespeichert werden: ${message}` }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
