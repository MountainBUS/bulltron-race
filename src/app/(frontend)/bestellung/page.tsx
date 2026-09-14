import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getStripe, isStripeConfigured } from '../../../lib/stripe'
import { formatPrice } from '../../../lib/format'
import { ClearCart } from '../../../components/ClearCart'
import { IconArrow, IconCheck } from '../../../components/Icons'

export const metadata: Metadata = {
  title: 'Bestellbestätigung',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams

  let email: string | null = null
  let total: number | null = null
  let paid = false

  if (sessionId && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId)
      email = session.customer_details?.email ?? null
      total = (session.amount_total ?? 0) / 100
      paid = session.payment_status === 'paid'
    } catch {
      /* Ungültige oder abgelaufene Session — wir zeigen die neutrale Bestätigung. */
    }
  }

  return (
    <>
      <ClearCart />

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="success-mark">
              <IconCheck size={42} />
            </div>

            <span className="eyebrow" style={{ justifyContent: 'center' }}>Schritt 3 von 3</span>
            <h1 className="h-lg">Danke für deine Bestellung</h1>
            <p className="lead" style={{ marginTop: '1rem' }}>
              {paid
                ? 'Deine Zahlung ist bei uns eingegangen.'
                : 'Deine Bestellung ist eingegangen. Sobald die Zahlung bestätigt ist, bekommst du eine Nachricht.'}{' '}
              {email ? (
                <>
                  Die Bestätigung geht an <strong style={{ color: 'var(--text)' }}>{email}</strong>.
                </>
              ) : null}
            </p>
          </div>

          {total ? (
            <div className="summary" style={{ position: 'static', marginTop: '2.5rem' }}>
              <h2>Zusammenfassung</h2>
              <div className="summary__row summary__row--total" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
                <span>Bezahlt</span>
                <span className="mono-num">{formatPrice(total)}</span>
              </div>
            </div>
          ) : null}

          <div className="notice notice--info" style={{ marginTop: '2rem' }}>
            Wir versenden aus Deutschland, in der Regel innerhalb von 2–4 Werktagen. Die Sendungsnummer bekommst du per
            E-Mail, sobald das Paket unterwegs ist.
          </div>

          <div className="btn-row" style={{ marginTop: '2rem', justifyContent: 'center' }}>
            <Link href="/produkte" className="btn">
              Weiter stöbern
              <IconArrow />
            </Link>
            <a href="mailto:info@bulltron-race.de" className="btn btn--ghost">
              Frage zur Bestellung
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
