import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { seoField } from '../fields/seo'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Produkt', plural: 'Produkte' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'price', 'status'],
    group: 'Shop',
    description: 'Alle Batterien. Jedes Produkt erzeugt automatisch eine Detailseite.',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'title', type: 'text', label: 'Produktname', required: true },
    slugField(),
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'published',
      options: [
        { label: 'Veröffentlicht', value: 'published' },
        { label: 'Entwurf (nicht sichtbar)', value: 'draft' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Kategorie',
      required: true,
      admin: {
        position: 'sidebar',
        description:
          'Bestimmt, auf welcher Kategorieseite die Batterie erscheint und unter welchem Menüpunkt sie zu finden ist. Jede Batterie gehört zu genau einer Kategorie.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Reihenfolge',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Auf der Startseite hervorheben',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Überblick',
          fields: [
            { name: 'subtitle', type: 'text', label: 'Untertitel', admin: { description: 'z. B. „12V Lithium Starterbatterie“' } },
            { name: 'badge', type: 'text', label: 'Badge', admin: { description: 'Kleines Label auf der Produktkachel, z. B. „Bestseller“. Leer lassen für keins.' } },
            { name: 'shortDescription', type: 'textarea', label: 'Kurzbeschreibung', admin: { description: 'Erscheint auf Kacheln und in der Suchvorschau.' } },
            {
              name: 'keyData',
              type: 'group',
              label: 'Eckdaten (erscheinen auf der Produktkachel)',
              fields: [
                { name: 'voltage', type: 'text', label: 'Spannung', admin: { width: '25%' } },
                { name: 'capacity', type: 'text', label: 'Kapazität', admin: { width: '25%' } },
                { name: 'current', type: 'text', label: 'Strom', admin: { width: '25%' } },
                { name: 'weight', type: 'text', label: 'Gewicht', admin: { width: '25%' } },
              ],
            },
            {
              name: 'highlights',
              type: 'array',
              label: 'Highlights (Häkchenliste)',
              fields: [{ name: 'text', type: 'text', label: 'Text', required: true }],
            },
          ],
        },
        {
          label: 'Preis & Versand',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'price', type: 'number', label: 'Preis (€, brutto)', required: true, min: 0, admin: { width: '33%', step: 0.01 } },
                { name: 'compareAtPrice', type: 'number', label: 'Streichpreis (€)', min: 0, admin: { width: '33%', step: 0.01, description: 'Optional.' } },
                { name: 'sku', type: 'text', label: 'Artikelnummer', admin: { width: '34%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'availability',
                  type: 'select',
                  label: 'Verfügbarkeit',
                  defaultValue: 'in_stock',
                  options: [
                    { label: 'Auf Lager', value: 'in_stock' },
                    { label: 'Wenige verfügbar', value: 'low_stock' },
                    { label: 'Lieferzeit auf Anfrage', value: 'on_request' },
                    { label: 'Ausverkauft', value: 'sold_out' },
                  ],
                  admin: { width: '50%' },
                },
                { name: 'deliveryTime', type: 'text', label: 'Lieferzeit', defaultValue: '2–4 Werktage', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ean',
                  type: 'text',
                  label: 'EAN',
                  admin: { width: '50%', description: 'Dreizehnstellig, aus der Preisliste. Wird für Preisportale und Warenwirtschaft gebraucht.' },
                },
                {
                  name: 'shippingWeight',
                  type: 'number',
                  label: 'Versandgewicht (kg)',
                  min: 0,
                  admin: { width: '50%', step: 0.1, description: 'Bruttogewicht inklusive Verpackung — Grundlage für die Versandkosten.' },
                },
              ],
            },
            { name: 'shippingNote', type: 'text', label: 'Versandhinweis', admin: { description: 'Erscheint klein unter dem Preis.' } },
          ],
        },
        {
          label: 'Bilder & Video',
          fields: [
            { name: 'mainImage', type: 'upload', relationTo: 'media', label: 'Hauptbild' },
            {
              name: 'gallery',
              type: 'array',
              label: 'Weitere Bilder',
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', label: 'Bild', required: true }],
            },
            {
              name: 'video',
              type: 'group',
              label: 'YouTube-Video',
              admin: { description: 'Wird auf der Produktdetailseite eingebunden. Leer lassen, wenn kein Video gewünscht ist.' },
              fields: [
                {
                  name: 'url',
                  type: 'text',
                  label: 'YouTube-Link oder Video-ID',
                  admin: { description: 'Beliebiges Format: https://youtu.be/ID, https://www.youtube.com/watch?v=ID oder nur die ID.' },
                },
                { name: 'title', type: 'text', label: 'Überschrift über dem Video', defaultValue: 'Das Produkt im Einsatz' },
                { name: 'description', type: 'textarea', label: 'Text neben/unter dem Video' },
                {
                  name: 'previewImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Vorschaubild',
                  admin: { description: 'Wird vor dem Klick angezeigt. Ohne Bild erscheint eine neutrale Fläche mit Play-Button.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Beschreibung & Daten',
          fields: [
            { name: 'description', type: 'richText', label: 'Ausführliche Beschreibung' },
            {
              name: 'specs',
              type: 'array',
              label: 'Technische Daten (Tabelle)',
              fields: [
                { name: 'label', type: 'text', label: 'Bezeichnung', required: true, admin: { width: '50%' } },
                { name: 'value', type: 'text', label: 'Wert', required: true, admin: { width: '50%' } },
              ],
            },
            {
              name: 'downloads',
              type: 'array',
              label: 'Downloads (Datenblätter etc.)',
              fields: [
                { name: 'label', type: 'text', label: 'Titel', required: true },
                { name: 'url', type: 'text', label: 'Link' },
              ],
            },
          ],
        },
        { label: 'SEO', fields: [seoField] },
      ],
    },
  ],
}
