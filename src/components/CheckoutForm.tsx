'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { formatPrice } from '../lib/format'
import { calculateShipping } from '../lib/shipping'
import { IconArrow, IconLock } from './Icons'

type Props = {
  shippingCost: number
  freeShippingFrom: number
  priceNote?: string | null
  termsUrl: string
  privacyUrl: string
}

export const CheckoutForm = ({ shippingCost, freeShippingFrom, priceNote, termsUrl, privacyUrl }: Props) => {
  const { items, subtotal, ready } = useCart()
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedWithdrawal, setAcceptedWithdrawal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!ready) return <p className="muted">Bestellung wird geladen …</p>

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>Kein Artikel im Warenkorb</h2>
        <p>Leg zuerst eine Batterie in den Warenkorb, dann geht es hier weiter.</p>
        <Link href="/produkte" className="btn">
          Zum Sortiment
          <IconArrow />
        </Link>
      </div>
    )
  }

  const shipping = calculateShipping(subtotal, { shippingCost, freeShippingFrom })
  const total = subtotal + shipping
  const canSubmit = acceptedTerms && acceptedWithdrawal && !loading

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/shop/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Die Zahlung konnte nicht gestartet werden.')
      }
      window.location.href = data.url as string
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unbekannter Fehler.')
      setLoading(false)
    }
  }

  return (
    <div className="cart-layout">
      <div>
        <h2 className="h-sm" style={{ marginBottom: '1.1rem' }}>Deine Bestellung</h2>

        {items.map((item) => (
          <article className="cart-item" key={item.id}>
            <div className="cart-item__media">{item.image ? <img src={item.image} alt="" /> : null}</div>
            <div>
              <h3 className="cart-item__title">{item.title}</h3>
              {item.sku ? <p className="muted" style={{ fontSize: '0.82rem' }}>Art.-Nr. {item.sku}</p> : null}
              <p className="muted" style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
            <div className="cart-item__actions">
              <span className="price" style={{ fontSize: '1.3rem' }}>{formatPrice(item.price * item.quantity)}</span>
            </div>
          </article>
        ))}

        <div className="notice notice--info" style={{ marginTop: '1.5rem' }}>
          Lieferadresse und Zahlungsart gibst du im nächsten Schritt auf der gesicherten Stripe-Seite ein. Bulltron Race
          speichert selbst keine Zahlungsdaten.
        </div>

        <Link href="/warenkorb" className="link-arrow" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
          Warenkorb ändern
        </Link>
      </div>

      <aside className="summary">
        <h2>Summe</h2>
        <div className="summary__row">
          <span>Zwischensumme</span>
          <span className="mono-num">{formatPrice(subtotal)}</span>
        </div>
        <div className="summary__row">
          <span>Versand</span>
          <span className="mono-num">{shipping === 0 ? 'kostenfrei' : formatPrice(shipping)}</span>
        </div>
        <div className="summary__row summary__row--total">
          <span>Gesamt</span>
          <span className="mono-num">{formatPrice(total)}</span>
        </div>
        <p className="price-note" style={{ marginTop: '0.5rem' }}>{priceNote}</p>

        <div style={{ display: 'grid', gap: '0.9rem', marginTop: '1.5rem' }}>
          <label className="checkbox">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
            <span>
              Ich akzeptiere die <Link href={termsUrl}>AGB</Link> und habe die{' '}
              <Link href={privacyUrl}>Datenschutzerklärung</Link> zur Kenntnis genommen.
            </span>
          </label>

          <label className="checkbox">
            <input type="checkbox" checked={acceptedWithdrawal} onChange={(e) => setAcceptedWithdrawal(e.target.checked)} />
            <span>Ich habe die Widerrufsbelehrung gelesen und verstanden.</span>
          </label>
        </div>

        {error ? (
          <div className="notice" style={{ marginTop: '1.2rem' }}>
            {error}
          </div>
        ) : null}

        <button type="button" className="btn btn--block btn--lg" style={{ marginTop: '1.4rem' }} disabled={!canSubmit} onClick={submit}>
          {loading ? 'Wird weitergeleitet …' : 'Zahlungspflichtig bestellen'}
        </button>

        <p className="price-note" style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <IconLock size={15} /> SSL-verschlüsselt · Zahlung über Stripe
        </p>
      </aside>
    </div>
  )
}
