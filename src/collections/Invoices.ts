import path from 'path'
import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'
import { csvHandler, stornoHandler, zipHandler } from '../lib/rechnung-export'

/**
 * Rechnungen.
 *
 * EINE RECHNUNG IST EIN DOKUMENT, KEINE ANSICHT. Sie wird einmal erzeugt, als
 * PDF abgelegt und danach nicht mehr verändert. Alle Angaben — Anschrift,
 * Positionen, Beträge — stehen als Abschrift in diesem Datensatz und nicht als
 * Verweis auf die Bestellung. Würde die Rechnung aus der Bestellung gerechnet,
 * sähe eine Rechnung von heute nach der nächsten Preis- oder Textänderung
 * anders aus. Das verträgt sich weder mit den Aufbewahrungspflichten noch mit
 * dem, was der Kunde in Händen hält.
 *
 * NUMMERNKREIS: BR-JJJJ-NNNN, vierstellig, je Jahr bei 1 beginnend. Auf der
 * Nummer liegt ein eindeutiger Index — zwei gleiche Nummern kann die Datenbank
 * gar nicht erst aufnehmen. Vergeben wird sie in `src/lib/rechnung.ts`.
 *
 * LÖSCHEN IST ABGESCHALTET. Eine Rechnung verschwindet nicht, sie wird
 * storniert: Die Stornorechnung bekommt eine eigene Nummer aus demselben Kreis
 * und verweist auf das Original, das Original bleibt stehen und wird
 * gekennzeichnet. Für Testdaten vor dem Livegang lässt sich eine Rechnung über
 * ein Skript mit `overrideAccess` entfernen — bewusst nur so, nicht mit einem
 * Klick im Backend.
 */
export const Invoices: CollectionConfig = {
  slug: 'invoices',
  labels: { singular: 'Rechnung', plural: 'Rechnungen' },
  admin: {
    useAsTitle: 'invoiceNumber',
    defaultColumns: ['invoiceNumber', 'invoiceDate', 'customerName', 'grossTotal', 'kind', 'cancelled'],
    group: 'Shop',
    description:
      'Jede bezahlte Bestellung erzeugt eine Rechnung. Die Angaben stehen fest und lassen sich nicht ändern — eine falsche Rechnung wird storniert, nicht korrigiert.',
    listSearchableFields: ['invoiceNumber', 'customerName', 'email'],
    components: { beforeList: ['/components/admin/RechnungsExport#RechnungsExport'] },
  },
  access: {
    /* Nicht öffentlich: Hier stehen Namen und Anschriften von Kunden. */
    read: authenticated,
    create: authenticated,
    /* NICHT ÄNDERBAR, und zwar wirklich: `admin.readOnly` an den Feldern wirkt
       nur in der Oberfläche — über die API ließe sich eine Rechnung sonst
       umschreiben, Nummer und Betrag eingeschlossen. Was das System selbst
       ändern muss (das Kennzeichen „storniert" am Original), läuft mit
       `overrideAccess` und bleibt davon unberührt. */
    update: () => false,
    delete: () => false,
  },
  defaultSort: '-invoiceNumber',
  /* Die drei Endpunkte liegen an der Collection, nicht im Frontend: So laufen
     sie mit der Anmeldung des Backends, ohne dass dafür eine eigene Prüfung
     gebaut werden muss. Erreichbar unter /api/invoices/... */
  endpoints: [
    { path: '/:id/storno', method: 'post', handler: stornoHandler },
    { path: '/export/zip', method: 'get', handler: zipHandler },
    { path: '/export/csv', method: 'get', handler: csvHandler },
  ],
  upload: {
    /* Außerhalb von `public`, damit Next.js die Dateien nicht von sich aus
       ausliefert. Im Container landet das Verzeichnis auf demselben Volume wie
       die Bilder, es braucht also kein zweites. */
    staticDir:
      process.env.INVOICE_DIR ||
      (process.env.MEDIA_DIR ? path.join(process.env.MEDIA_DIR, 'rechnungen') : 'private/rechnungen'),
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      label: 'Rechnungsnummer',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    /* Jahr und laufende Nummer stehen zusätzlich als Zahlen da. Die
       Rechnungsnummer ließe sich zwar zerlegen, aber nach ihr zu sortieren
       wäre eine Falle: „BR-2026-10000" stünde als Text vor „BR-2026-9999".
       Für das Ermitteln der nächsten freien Nummer wird deshalb `sequence`
       verwendet, nicht die Zeichenkette. */
    {
      name: 'year',
      type: 'number',
      label: 'Jahr',
      required: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'sequence',
      type: 'number',
      label: 'Laufende Nummer',
      required: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'kind',
      type: 'select',
      label: 'Art',
      required: true,
      defaultValue: 'invoice',
      options: [
        { label: 'Rechnung', value: 'invoice' },
        { label: 'Stornorechnung', value: 'cancellation' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'invoiceDate',
      type: 'date',
      label: 'Rechnungsdatum',
      required: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
      },
    },
    {
      name: 'cancelled',
      type: 'checkbox',
      label: 'Storniert',
      defaultValue: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Wird gesetzt, sobald eine Stornorechnung zu dieser Rechnung besteht.',
      },
    },
    {
      name: 'stornoKnopf',
      type: 'ui',
      label: 'Stornieren',
      admin: { position: 'sidebar', components: { Field: '/components/admin/StornoKnopf#StornoKnopf' } },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Beträge und Positionen',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'netTotal', type: 'number', label: 'Netto (€)', admin: { width: '25%', readOnly: true } },
                { name: 'taxRate', type: 'number', label: 'MwSt.-Satz (%)', admin: { width: '25%', readOnly: true } },
                { name: 'taxTotal', type: 'number', label: 'MwSt. (€)', admin: { width: '25%', readOnly: true } },
                { name: 'grossTotal', type: 'number', label: 'Brutto (€)', admin: { width: '25%', readOnly: true } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'itemsGross', type: 'number', label: 'Warenwert brutto (€)', admin: { width: '33%', readOnly: true } },
                { name: 'discountGross', type: 'number', label: 'Rabatt brutto (€)', admin: { width: '33%', readOnly: true } },
                { name: 'shippingGross', type: 'number', label: 'Versand brutto (€)', admin: { width: '34%', readOnly: true } },
              ],
            },
            {
              name: 'couponCode',
              type: 'text',
              label: 'Gutscheincode',
              admin: { readOnly: true },
            },
            {
              name: 'items',
              type: 'array',
              label: 'Positionen',
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', label: 'Bezeichnung', admin: { width: '45%' } },
                    { name: 'sku', type: 'text', label: 'Artikelnummer', admin: { width: '20%' } },
                    { name: 'quantity', type: 'number', label: 'Menge', admin: { width: '10%' } },
                    { name: 'unitPrice', type: 'number', label: 'Einzelpreis (€)', admin: { width: '12%' } },
                    { name: 'lineTotal', type: 'number', label: 'Summe (€)', admin: { width: '13%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Kunde und Bestellung',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'customerName', type: 'text', label: 'Name', admin: { width: '50%', readOnly: true } },
                { name: 'email', type: 'text', label: 'E-Mail', admin: { width: '50%', readOnly: true } },
              ],
            },
            {
              name: 'address',
              type: 'group',
              label: 'Rechnungsanschrift',
              admin: { readOnly: true },
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
              name: 'order',
              type: 'relationship',
              relationTo: 'orders',
              label: 'Bestellung',
              admin: { readOnly: true },
            },
            {
              name: 'orderNumber',
              type: 'text',
              label: 'Bestellnummer',
              admin: { readOnly: true, description: 'Als Abschrift, damit die Rechnung auch ohne die Bestellung vollständig ist.' },
            },
            {
              name: 'paidAt',
              type: 'date',
              label: 'Zahlungseingang',
              admin: {
                readOnly: true,
                date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
                description: 'Gezahlt wird im Shop immer sofort; dieses Datum ist zugleich das Leistungsdatum.',
              },
            },
            { name: 'paymentReference', type: 'text', label: 'Zahlungsbeleg', admin: { readOnly: true, description: 'Payment Intent bei Stripe.' } },
          ],
        },
        {
          label: 'Storno',
          fields: [
            {
              name: 'cancels',
              type: 'relationship',
              relationTo: 'invoices',
              label: 'Storniert die Rechnung',
              admin: { readOnly: true, description: 'Nur bei einer Stornorechnung gefüllt.' },
            },
            {
              name: 'cancelledBy',
              type: 'relationship',
              relationTo: 'invoices',
              label: 'Storniert durch',
              admin: { readOnly: true, description: 'Nur bei einer stornierten Rechnung gefüllt.' },
            },
            {
              name: 'cancellationReason',
              type: 'textarea',
              label: 'Grund des Storno',
              admin: { readOnly: true },
            },
          ],
        },
      ],
    },
  ],
}
