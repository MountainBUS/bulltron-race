import React from 'react'
import Link from 'next/link'
import type { Product } from '../payload-types'
import { mediaAlt, mediaUrl } from '../lib/media'
import { availabilityLabel, formatPrice } from '../lib/format'
import { AddToCart } from './AddToCart'
import { shopEnabled, ANFRAGE_TEL } from '../lib/shop'
import { IconArrow } from './Icons'

export const ProductCard = ({ product }: { product: Product }) => {
  const image = mediaUrl(product.mainImage, 'card')
  const availability = availabilityLabel[product.availability ?? 'in_stock'] ?? availabilityLabel.in_stock
  const key = product.keyData ?? {}
  const chips = [
    { label: 'Spannung', value: key.voltage },
    { label: 'Kapazität', value: key.capacity },
    { label: 'Strom', value: key.current },
    { label: 'Gewicht', value: key.weight },
  ].filter((chip) => Boolean(chip.value))

  return (
    <article className="product-card">
      <Link href={`/produkte/${product.slug}`} className="product-card__media" aria-label={product.title}>
        {product.badge ? <span className="badge">{product.badge}</span> : null}
        {image ? <img src={image} alt={mediaAlt(product.mainImage, product.title)} loading="lazy" /> : null}
      </Link>

      <div className="product-card__body">
        <h3 className="product-card__title">
          <Link href={`/produkte/${product.slug}`}>{product.title}</Link>
        </h3>
        {product.subtitle ? <p className="product-card__sub">{product.subtitle}</p> : null}

        {chips.length > 0 ? (
          <div className="spec-row" style={{ gridTemplateColumns: `repeat(${chips.length}, 1fr)` }}>
            {chips.map((chip) => (
              <div className="spec-chip" key={chip.label}>
                <div className="spec-chip__value">{chip.value}</div>
                <div className="spec-chip__label">{chip.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        <p className={`availability ${availability.modifier}`} style={{ marginBottom: '1.1rem' }}>
          {availability.label}
        </p>

        <div className="product-card__foot">
          <div>
            <div className="price">
              {formatPrice(product.price)}
              {product.compareAtPrice ? <span className="price__strike">{formatPrice(product.compareAtPrice)}</span> : null}
            </div>
            <div className="price-note">inkl. MwSt., zzgl. Versand</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {shopEnabled ? (
              <AddToCart
                className="btn btn--sm"
                label="Kaufen"
                disabled={!availability.buyable}
                product={{
                  id: String(product.id),
                  slug: product.slug,
                  title: product.title,
                  subtitle: product.subtitle,
                  sku: product.sku,
                  price: product.price,
                  image,
                }}
              />
            ) : (
              <a href={ANFRAGE_TEL} className="btn btn--sm">
                Anfragen
              </a>
            )}
            <Link href={`/produkte/${product.slug}`} className="btn btn--sm btn--ghost">
              Details
              <IconArrow size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
