import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSiteSettings } from '../../../lib/payload'
import { CheckoutForm } from '../../../components/CheckoutForm'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kasse',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  const settings = await getSiteSettings()

  return (
    <>
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Start</Link>
          <span>/</span>
          <Link href="/warenkorb">Warenkorb</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-soft)' }}>Kasse</span>
        </nav>
      </div>

      <section className="section section--tight">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Schritt 2 von 3</span>
            <h1 className="h-lg">Bestellung prüfen</h1>
          </div>

          <CheckoutForm
            shippingCost={settings.shippingCost ?? 0}
            freeShippingFrom={settings.freeShippingFrom ?? 0}
            priceNote={settings.legal?.priceNote}
            termsUrl={settings.legal?.termsUrl ?? '/agb'}
            privacyUrl={settings.legal?.privacyUrl ?? '/datenschutz'}
          />
        </div>
      </section>
    </>
  )
}
