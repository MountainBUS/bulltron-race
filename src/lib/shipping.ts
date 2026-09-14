type ShippingSettings = {
  shippingCost?: number | null
  freeShippingFrom?: number | null
}

/** Ermittelt die Versandkosten aus den Shop-Einstellungen. */
export const calculateShipping = (subtotal: number, settings: ShippingSettings): number => {
  const cost = settings.shippingCost ?? 0
  const threshold = settings.freeShippingFrom ?? 0
  if (threshold > 0 && subtotal >= threshold) return 0
  return cost
}
