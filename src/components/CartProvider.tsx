'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  sku?: string | null
  price: number
  image?: string | null
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  ready: boolean
  count: number
  subtotal: number
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
  lastAdded: string | null
}

const STORAGE_KEY = 'bulltron-race.cart.v1'

const CartContext = createContext<CartContextValue | null>(null)

const readStorage = (): CartItem[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is CartItem =>
        item && typeof item.id === 'string' && typeof item.price === 'number' && typeof item.quantity === 'number',
    )
  } catch {
    return []
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  useEffect(() => {
    setItems(readStorage())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* Privater Modus o. Ä. — der Warenkorb lebt dann nur für diese Sitzung. */
    }
  }, [items, ready])

  const add: CartContextValue['add'] = useCallback((item, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.id === item.id)
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: Math.min(entry.quantity + quantity, 99) } : entry,
        )
      }
      return [...current, { ...item, quantity: Math.min(quantity, 99) }]
    })
    setLastAdded(item.id)
    window.setTimeout(() => setLastAdded(null), 2600)
  }, [])

  const setQuantity: CartContextValue['setQuantity'] = useCallback((id, quantity) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((entry) => entry.id !== id)
        : current.map((entry) => (entry.id === id ? { ...entry, quantity: Math.min(quantity, 99) } : entry)),
    )
  }, [])

  const remove: CartContextValue['remove'] = useCallback((id) => {
    setItems((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return { items, ready, count, subtotal, add, setQuantity, remove, clear, lastAdded }
  }, [items, ready, add, setQuantity, remove, clear, lastAdded])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart muss innerhalb von <CartProvider> verwendet werden.')
  return context
}
