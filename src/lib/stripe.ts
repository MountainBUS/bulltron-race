import Stripe from 'stripe'

let client: Stripe | null = null

export const getStripe = (): Stripe => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY ist nicht gesetzt. Bitte in der .env hinterlegen.')
  }
  if (!client) {
    client = new Stripe(key, { apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion })
  }
  return client
}

export const isStripeConfigured = (): boolean => Boolean(process.env.STRIPE_SECRET_KEY)
