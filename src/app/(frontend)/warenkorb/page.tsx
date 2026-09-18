import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSiteSettings } from '../../../lib/payload'
import { CartView } from '../../../components/CartView'
import { VerkaeuferHinweis } from '../../../components/VerkaeuferHinweis'

export const metadata: Metadata = {
  title: 'Warenkorb',
  robots: { index: false, follow: false },
}

export default async function CartPage({ searchParams }: { searchParams: Promise<{ abbruch?: string }> }) {
  const [settings, query] = await Promise.all([getSiteSettings(), searchParams])

  return (
    <>
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Start</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-soft)' }}>Warenkorb</span>
        </nav>
      </div>

      <section className="section section--tight">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Warenkorb</span>
            <h1 className="h-lg">Deine Auswahl</h1>
          </div>

          <VerkaeuferHinweis titel={settings.sellerNotice?.title} text={settings.sellerNotice?.text} />

          {query?.abbruch ? (
            <div className="notice" style={{ marginBottom: '1.5rem' }}>
              Die Zahlung wurde abgebrochen. Dein Warenkorb ist unverändert — du kannst den Kauf jederzeit erneut starten.
            </div>
          ) : null}

          <CartView
            shippingCost={settings.shippingCost ?? 0}
            freeShippingFrom={settings.freeShippingFrom ?? 0}
            note={settings.checkoutNote}
            priceNote={settings.legal?.priceNote}
          />
        </div>
      </section>
    </>
  )
}
