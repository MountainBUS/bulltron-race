'use client'

import { useEffect } from 'react'
import { useCart } from './CartProvider'

/** Leert den Warenkorb, sobald die Bestellbestätigung angezeigt wird. */
export const ClearCart = () => {
  const { clear, ready, items } = useCart()

  useEffect(() => {
    if (ready && items.length > 0) clear()
  }, [ready, items.length, clear])

  return null
}
