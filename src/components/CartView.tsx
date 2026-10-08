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
  note?: string | null
  priceNote?: string | null
}

export const CartView = ({ shippingCost, freeShippingFrom, note, priceNote }: Props) => {
  const { items, setQuantity, remove, subtotal, ready, gutschein } = useCart()

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

  /* Die Reihenfolge ist Absicht und folgt dem, was der Kunde erwartet:
     Der Rabatt geht vom Warenwert ab, der Versand kommt danach obendrauf. Die
     Schwelle für kostenlosen Versand bemisst sich weiterhin am Warenwert VOR
     dem Rabatt — sonst fiele der Versand durch einen Gutschein plötzlich wieder
     an, und das verstünde zu Recht niemand. */
  const rabatt = gutschein?.rabatt ?? 0
  const shipping = gutschein?.versandfrei ? 0 : calculateShipping(subtotal, { shippingCost, freeShippingFrom })
  const total = Math.max(subtotal - rabatt, 0) + shipping
  const missingForFree = freeShippingFrom > 0 && !gutschein?.versandfrei ? freeShippingFrom - subtotal : 0

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
        {gutschein && rabatt > 0 ? (
          <div className="summary__row summary__row--rabatt">
            <span>
              Rabatt <span className="summary__code">{gutschein.code}</span>
            </span>
            <span className="mono-num">−{formatPrice(rabatt)}</span>
          </div>
        ) : null}
        <div className="summary__row">
          <span>Versand</span>
          {/* Dass der Versand durch den Gutschein entfällt, steht im Block
              darunter mit Code und Beschriftung — hier genügt „kostenfrei". */}
          <span className="mono-num">{shipping === 0 ? 'kostenfrei' : formatPrice(shipping)}</span>
        </div>
        <div className="summary__row summary__row--total">
          <span>Gesamt</span>
          <span className="mono-num">{formatPrice(total)}</span>
        </div>

        <GutscheinFeld />

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

/**
 * Eingabe des Gutscheincodes.
 *
 * Geprüft wird ausschließlich auf dem Server; dieses Feld zeigt nur an, was von
 * dort zurückkommt. Es rechnet selbst nichts und kennt die Bedingungen der
 * Codes nicht — es könnte sie sonst jemand im Browser nachlesen.
 */
const GutscheinFeld = () => {
  const { gutschein, gutscheinPruefung, gutscheinFehler, gutscheinEinloesen, gutscheinEntfernen } = useCart()
  const [eingabe, setEingabe] = useState('')

  if (gutschein) {
    return (
      <div className="gutschein gutschein--aktiv">
        <div>
          <span className="gutschein__code">{gutschein.code}</span>
          <span className="gutschein__text">{gutschein.beschriftung}</span>
        </div>
        <button type="button" className="gutschein__entfernen" onClick={gutscheinEntfernen}>
          Entfernen
        </button>
      </div>
    )
  }

  const absenden = async (event: React.FormEvent) => {
    event.preventDefault()
    const erfolg = await gutscheinEinloesen(eingabe)
    if (erfolg) setEingabe('')
  }

  return (
    <form className="gutschein" onSubmit={absenden}>
      <label className="gutschein__label" htmlFor="gutschein-code">
        Gutscheincode
      </label>
      <div className="gutschein__reihe">
        <input
          id="gutschein-code"
          type="text"
          className="gutschein__eingabe"
          value={eingabe}
          onChange={(event) => setEingabe(event.target.value)}
          placeholder="Code eingeben"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={gutscheinPruefung}
          aria-describedby={gutscheinFehler ? 'gutschein-fehler' : undefined}
          aria-invalid={gutscheinFehler ? true : undefined}
        />
        <button type="submit" className="btn btn--dark gutschein__knopf" disabled={gutscheinPruefung || !eingabe.trim()}>
          {gutscheinPruefung ? 'Prüfe …' : 'Einlösen'}
        </button>
      </div>
      {gutscheinFehler ? (
        <p className="gutschein__fehler" id="gutschein-fehler" role="status">
          {gutscheinFehler}
        </p>
      ) : null}
    </form>
  )
}
