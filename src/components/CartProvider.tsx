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

/**
 * Ein angenommener Gutschein, so wie der Server ihn berechnet hat.
 *
 * Gespeichert wird im Browser NUR der Code. Betrag und Beschriftung kommen bei
 * jeder Änderung frisch vom Server — sonst stünde nach dem Hinzufügen eines
 * Artikels noch der alte Rabatt da, und ein Code, der inzwischen abgelaufen
 * ist, bliebe im Warenkorb kleben.
 */
export type AngewandterGutschein = {
  code: string
  art: 'percent' | 'amount' | 'shipping'
  rabatt: number
  versandfrei: boolean
  beschriftung: string
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
  /** Der geprüfte Gutschein, oder null. */
  gutschein: AngewandterGutschein | null
  /** Läuft gerade eine Prüfung? Für den Zustand des Eingabefelds. */
  gutscheinPruefung: boolean
  /** Meldung des Servers, wenn der Code nicht greift. */
  gutscheinFehler: string | null
  /** Code einlösen. Gibt zurück, ob er angenommen wurde. */
  gutscheinEinloesen: (code: string) => Promise<boolean>
  gutscheinEntfernen: () => void
}

const STORAGE_KEY = 'bulltron-race.cart.v1'
const GUTSCHEIN_KEY = 'bulltron-race.gutschein.v1'

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

  /* --- Gutschein ---------------------------------------------------------
     Im Browser liegt nur der Code. Betrag und Beschriftung holt der Server bei
     jeder Änderung neu — damit stimmt der angezeigte Rabatt immer zum aktuellen
     Warenkorb, und ein Code, der zwischenzeitlich abgelaufen oder ausgeschöpft
     ist, verschwindet von selbst. */
  const [gutscheinCode, setGutscheinCode] = useState<string | null>(null)
  const [gutschein, setGutschein] = useState<AngewandterGutschein | null>(null)
  const [gutscheinPruefung, setGutscheinPruefung] = useState(false)
  const [gutscheinFehler, setGutscheinFehler] = useState<string | null>(null)

  useEffect(() => {
    try {
      const gespeichert = window.localStorage.getItem(GUTSCHEIN_KEY)
      if (gespeichert) setGutscheinCode(gespeichert)
    } catch {
      /* Privater Modus — dann gilt der Code nur für diese Sitzung. */
    }
  }, [])

  const gutscheinEntfernen = useCallback(() => {
    setGutscheinCode(null)
    setGutschein(null)
    setGutscheinFehler(null)
    try {
      window.localStorage.removeItem(GUTSCHEIN_KEY)
    } catch {
      /* egal */
    }
  }, [])

  /* Eine Prüfung je Änderung, und bei schnellem Klicken auf Plus und Minus nur
     die letzte: Die vorherige wird verworfen, bevor sie losläuft. */
  useEffect(() => {
    if (!ready) return
    if (!gutscheinCode) {
      setGutschein(null)
      setGutscheinFehler(null)
      return
    }
    if (items.length === 0) {
      setGutschein(null)
      return
    }

    let verworfen = false
    const warten = window.setTimeout(async () => {
      setGutscheinPruefung(true)
      try {
        const antwort = await fetch('/shop/api/gutschein', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: gutscheinCode,
            items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          }),
        })
        const daten = await antwort.json()
        if (verworfen) return
        if (!antwort.ok) {
          setGutschein(null)
          setGutscheinFehler(typeof daten?.error === 'string' ? daten.error : 'Der Code konnte nicht geprüft werden.')
          return
        }
        setGutschein(daten as AngewandterGutschein)
        setGutscheinFehler(null)
      } catch {
        if (verworfen) return
        /* Netz weg: Der Rabatt wird nicht angezeigt, der Code bleibt aber
           gespeichert und greift beim nächsten Versuch wieder. */
        setGutschein(null)
        setGutscheinFehler('Der Code konnte gerade nicht geprüft werden.')
      } finally {
        if (!verworfen) setGutscheinPruefung(false)
      }
    }, 250)

    return () => {
      verworfen = true
      window.clearTimeout(warten)
    }
  }, [gutscheinCode, items, ready])

  const gutscheinEinloesen: CartContextValue['gutscheinEinloesen'] = useCallback(
    async (eingabe) => {
      const code = eingabe.replace(/\s+/g, '').toUpperCase()
      if (!code) return false
      setGutscheinPruefung(true)
      setGutscheinFehler(null)
      try {
        const antwort = await fetch('/shop/api/gutschein', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, items: items.map((item) => ({ id: item.id, quantity: item.quantity })) }),
        })
        const daten = await antwort.json()
        if (!antwort.ok) {
          setGutschein(null)
          setGutscheinFehler(typeof daten?.error === 'string' ? daten.error : 'Der Code konnte nicht geprüft werden.')
          return false
        }
        setGutschein(daten as AngewandterGutschein)
        setGutscheinCode(code)
        try {
          window.localStorage.setItem(GUTSCHEIN_KEY, code)
        } catch {
          /* egal */
        }
        return true
      } catch {
        setGutscheinFehler('Der Code konnte gerade nicht geprüft werden.')
        return false
      } finally {
        setGutscheinPruefung(false)
      }
    },
    [items],
  )

  const clear = useCallback(() => {
    setItems([])
    gutscheinEntfernen()
  }, [gutscheinEntfernen])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
      items,
      ready,
      count,
      subtotal,
      add,
      setQuantity,
      remove,
      clear,
      lastAdded,
      gutschein,
      gutscheinPruefung,
      gutscheinFehler,
      gutscheinEinloesen,
      gutscheinEntfernen,
    }
  }, [
    items,
    ready,
    add,
    setQuantity,
    remove,
    clear,
    lastAdded,
    gutschein,
    gutscheinPruefung,
    gutscheinFehler,
    gutscheinEinloesen,
    gutscheinEntfernen,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart muss innerhalb von <CartProvider> verwendet werden.')
  return context
}
