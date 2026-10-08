import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getPayloadClient, getSiteSettings } from '../../../../../lib/payload'
import { bestellungVersenden } from '../../../../../lib/mail'
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

  /* Die Summen kommen aus der Sitzung, nicht aus einer eigenen Rechnung:
     Gezahlt ist, was Stripe abgerechnet hat.

     `amount_subtotal` ist der Warenwert VOR Rabatt und ohne Versand. Vorher
     stand hier `total - shipping`; mit einem Gutschein wäre das die bereits
     verminderte Summe gewesen, und die Zwischensumme in der Bestellung hätte
     nicht mehr zur Preisliste gepasst. */
  const shipping = (session.total_details?.amount_shipping ?? 0) / 100
  const rabatt = (session.total_details?.amount_discount ?? 0) / 100
  const subtotal = (session.amount_subtotal ?? 0) / 100
  const total = (session.amount_total ?? 0) / 100
  const gutscheinCode = typeof session.metadata?.couponCode === 'string' ? session.metadata.couponCode : null
  const address = session.collected_information?.shipping_details?.address ?? session.customer_details?.address
  const recipient = session.collected_information?.shipping_details?.name ?? session.customer_details?.name

  let bestellung: Record<string, any>
  try {
    bestellung = (await payload.create({
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
        subtotal,
        discount: rabatt > 0 ? rabatt : undefined,
        shipping,
        total,
        couponCode: gutscheinCode ?? undefined,
        stripe: {
          sessionId: session.id,
          paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
          paymentStatus: session.payment_status ?? undefined,
        },
      },
    })) as Record<string, any>
  } catch (error) {
    // Stripe wiederholt die Zustellung, wenn wir einen Fehler melden.
    const message = error instanceof Error ? error.message : 'unbekannt'
    return NextResponse.json({ error: `Bestellung konnte nicht gespeichert werden: ${message}` }, { status: 500 })
  }

  /* Die Einlösung zählen — erst jetzt, denn erst jetzt ist bezahlt.

     GEZÄHLT, NICHT HOCHGEZÄHLT: Der Stand wird aus den Bestellungen mit diesem
     Code ermittelt und dann gesetzt. Ein „lies den Wert, addiere eins, schreib
     zurück" verlöre bei zwei gleichzeitigen Bestellungen eine davon; die
     Zählung kann das nicht, weil die Bestellung vor dem Zählen schon in der
     Datenbank steht. Nebenbei stimmt der Stand damit auch dann wieder, wenn
     eine Bestellung von Hand gelöscht wird.

     Ohne Auswirkung auf die Antwort: Scheitert das Zählen, ist die Bestellung
     trotzdem erfasst. Ein Fehler hier würde Stripe zur erneuten Zustellung
     veranlassen, die dann an der Dublettensperre endet — der Stand wäre
     genauso falsch, nur mit mehr Rauschen. */
  if (gutscheinCode) {
    try {
      const gutscheine = await payload.find({
        collection: 'coupons',
        where: { code: { equals: gutscheinCode } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const gutschein = gutscheine.docs[0]
      if (gutschein) {
        const eingeloest = await payload.count({
          collection: 'orders',
          where: { couponCode: { equals: gutscheinCode } },
          overrideAccess: true,
        })
        await payload.update({
          collection: 'coupons',
          id: gutschein.id,
          data: { redemptions: eingeloest.totalDocs } as never,
          overrideAccess: true,
        })
      } else {
        payload.logger.warn(`Gutschein ${gutscheinCode} wurde eingelöst, steht aber nicht mehr im Backend.`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unbekannt'
      payload.logger.error(`Einlösung von ${gutscheinCode} konnte nicht gezählt werden: ${message}`)
    }
  }

  /* Bestellbestätigung an den Kunden, Benachrichtigung an den Shop.
     Bewusst nach dem Speichern und bewusst ohne Auswirkung auf die Antwort:
     Scheitert der Mailversand, ist die Bestellung trotzdem erfasst. Würden wir
     hier einen Fehler melden, stellte Stripe erneut zu und liefe gegen die
     Dublettensperre — der Kunde bekäme davon nichts, der Shop nur Rauschen. */
  try {
    const settings = await getSiteSettings()
    await bestellungVersenden(payload, bestellung, settings as Record<string, any>)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unbekannt'
    payload.logger.error(`Mailversand zur Bestellung ${bestellung.orderNumber} fehlgeschlagen: ${message}`)
  }

  return NextResponse.json({ received: true })
}
