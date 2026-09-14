'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { formatPrice } from '../lib/format'
import { calculateShipping } from '../lib/shipping'
import { IconArrow, IconLock } from './Icons'

type Props = {
  shippingCost: number
  freeShippingFrom: number
  note?: string | null
  priceNote?: string | null
}

export const CartView = ({ shippingCost, freeShippingFrom, note, priceNote }: Props) => {
  const { items, setQuantity, remove, subtotal, ready } = useCart()

  if (!ready) {
    return <p className="muted">Warenkorb wird geladen …</p>
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>Dein Warenkorb ist leer</h2>
        <p>Such dir eine Batterie aus — wir haben für jede Disziplin die passende.</p>
        <Link href="/produkte" className="btn">
          Zum Sortiment
          <IconArrow />
        </Link>
      </div>
    )
  }

  const shipping = calculateShipping(subtotal, { shippingCost, freeShippingFrom })
  const total = subtotal + shipping
  const missingForFree = freeShippingFrom > 0 ? freeShippingFrom - subtotal : 0

  return (
    <div className="cart-layout">
      <div>
        {items.map((item) => (
          <article className="cart-item" key={item.id}>
            <div className="cart-item__media">
              {item.image ? <img src={item.image} alt="" /> : null}
            </div>

            <div>
              <h2 className="cart-item__title">
                <Link href={`/produkte/${item.slug}`}>{item.title}</Link>
              </h2>
              {item.subtitle ? <p className="muted" style={{ fontSize: '0.9rem' }}>{item.subtitle}</p> : null}
              {item.sku ? <p className="muted" style={{ fontSize: '0.82rem' }}>Art.-Nr. {item.sku}</p> : null}
              <p className="price" style={{ fontSize: '1.35rem', marginTop: '0.5rem' }}>
                {formatPrice(item.price)}
              </p>
            </div>

            <div className="cart-item__actions">
              <div className="qty">
                <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Menge verringern">
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={item.quantity}
                  aria-label={`Menge ${item.title}`}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10)
                    setQuantity(item.id, Number.isNaN(next) ? 1 : next)
                  }}
                />
                <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Menge erhöhen">
                  +
                </button>
              </div>
              <button type="button" className="cart-item__remove" onClick={() => remove(item.id)}>
                Entfernen
              </button>
            </div>
          </article>
        ))}

        {note ? (
          <div className="notice notice--info" style={{ marginTop: '1.25rem' }}>
            {note}
          </div>
        ) : null}
      </div>

      <aside className="summary">
        <h2>Zusammenfassung</h2>

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

        {missingForFree > 0 ? (
          <p className="price-note" style={{ marginTop: '0.6rem', color: 'var(--accent-bright)' }}>
            Noch {formatPrice(missingForFree)} bis zum versandkostenfreien Einkauf.
          </p>
        ) : null}

        <Link href="/kasse" className="btn btn--block btn--lg" style={{ marginTop: '1.5rem' }}>
          Zur Kasse
          <IconArrow />
        </Link>

        <p className="price-note" style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <IconLock size={15} /> Zahlung verschlüsselt über Stripe
        </p>
      </aside>
    </div>
  )
}
