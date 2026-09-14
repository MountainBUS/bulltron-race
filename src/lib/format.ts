const eur = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

export const formatPrice = (value: number | null | undefined): string =>
  eur.format(typeof value === 'number' ? value : 0)

export const toCents = (value: number): number => Math.round(value * 100)

export const formatDate = (value?: string | null): string => {
  if (!value) return ''
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date(value))
}

export const availabilityLabel: Record<string, { label: string; modifier: string; buyable: boolean }> = {
  in_stock: { label: 'Auf Lager', modifier: '', buyable: true },
  low_stock: { label: 'Nur noch wenige verfügbar', modifier: 'availability--low', buyable: true },
  on_request: { label: 'Lieferzeit auf Anfrage', modifier: 'availability--low', buyable: true },
  sold_out: { label: 'Derzeit ausverkauft', modifier: 'availability--out', buyable: false },
}
