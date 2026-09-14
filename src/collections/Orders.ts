import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Bestellung', plural: 'Bestellungen' },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'email', 'total', 'status', 'createdAt'],
    group: 'Shop',
    description: 'Wird automatisch von Stripe befüllt. Zahlungsdaten liegen ausschließlich bei Stripe.',
  },
  access: {
    read: authenticated,
    // Bestellungen entstehen ausschließlich über den verifizierten Stripe-Webhook (Local API).
    create: () => false,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'orderNumber', type: 'text', label: 'Bestellnummer', index: true },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'paid',
      options: [
        { label: 'Bezahlt', value: 'paid' },
        { label: 'In Bearbeitung', value: 'processing' },
        { label: 'Versendet', value: 'shipped' },
        { label: 'Storniert', value: 'cancelled' },
        { label: 'Erstattet', value: 'refunded' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', label: 'E-Mail', admin: { width: '50%' } },
        { name: 'customerName', type: 'text', label: 'Name', admin: { width: '50%' } },
      ],
    },
    { name: 'phone', type: 'text', label: 'Telefon' },
    {
      name: 'shippingAddress',
      type: 'group',
      label: 'Lieferadresse',
      fields: [
        { name: 'line1', type: 'text', label: 'Straße und Hausnummer' },
        { name: 'line2', type: 'text', label: 'Adresszusatz' },
        {
          type: 'row',
          fields: [
            { name: 'postalCode', type: 'text', label: 'PLZ', admin: { width: '30%' } },
            { name: 'city', type: 'text', label: 'Ort', admin: { width: '40%' } },
            { name: 'country', type: 'text', label: 'Land', admin: { width: '30%' } },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Positionen',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', label: 'Produkt' },
        { name: 'title', type: 'text', label: 'Bezeichnung' },
        { name: 'sku', type: 'text', label: 'Artikelnummer' },
        { name: 'quantity', type: 'number', label: 'Menge' },
        { name: 'unitPrice', type: 'number', label: 'Einzelpreis (€)' },
        { name: 'lineTotal', type: 'number', label: 'Summe (€)' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', type: 'number', label: 'Zwischensumme (€)', admin: { width: '33%' } },
        { name: 'shipping', type: 'number', label: 'Versand (€)', admin: { width: '33%' } },
        { name: 'total', type: 'number', label: 'Gesamt (€)', admin: { width: '34%' } },
      ],
    },
    {
      name: 'stripe',
      type: 'group',
      label: 'Stripe',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'sessionId', type: 'text', label: 'Checkout-Session', index: true },
        { name: 'paymentIntentId', type: 'text', label: 'Payment Intent' },
        { name: 'paymentStatus', type: 'text', label: 'Zahlungsstatus' },
      ],
    },
    { name: 'customerNote', type: 'textarea', label: 'Notiz' },
  ],
  timestamps: true,
}
