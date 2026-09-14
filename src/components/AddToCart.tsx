'use client'

import React, { useState } from 'react'
import { useCart, type CartItem } from './CartProvider'
import { IconCart, IconCheck } from './Icons'

type Props = {
  product: Omit<CartItem, 'quantity'>
  withQuantity?: boolean
  disabled?: boolean
  label?: string
  className?: string
}

export const AddToCart = ({
  product,
  withQuantity = false,
  disabled = false,
  label = 'In den Warenkorb',
  className = 'btn',
}: Props) => {
  const { add, lastAdded } = useCart()
  const [quantity, setQuantity] = useState(1)
  const justAdded = lastAdded === product.id

  if (disabled) {
    return (
      <button type="button" className={`${className} btn--dark`} disabled>
        Nicht verfügbar
      </button>
    )
  }

  return (
    <>
      {withQuantity ? (
        <div className="qty">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Menge verringern">
            −
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            aria-label="Menge"
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10)
              setQuantity(Number.isNaN(next) ? 1 : Math.min(99, Math.max(1, next)))
            }}
          />
          <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Menge erhöhen">
            +
          </button>
        </div>
      ) : null}

      <button type="button" className={className} onClick={() => add(product, quantity)} aria-live="polite">
        {justAdded ? <IconCheck size={17} /> : <IconCart size={17} />}
        {justAdded ? 'Hinzugefügt' : label}
      </button>
    </>
  )
}
