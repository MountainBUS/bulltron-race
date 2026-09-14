import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { seoField } from '../fields/seo'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Kategorie', plural: 'Kategorien' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'sortOrder'],
    group: 'Shop',
    description: 'Die Kategorie-Übersichtsseiten (Motorsport-, Rennsport- und Motorradbatterien).',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'title', type: 'text', label: 'Name', required: true },
    slugField(),
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Reihenfolge',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      /* Zeigt in der Kategorie alle Batterien, die ihr zugewiesen sind. Die
         Zuweisung selbst steht am Produkt im Feld „Kategorie“ — hier ist sie
         von der anderen Seite sichtbar und von hier aus auch anlegbar. */
      name: 'produkte',
      type: 'join',
      collection: 'products',
      on: 'category',
      label: 'Batterien in dieser Kategorie',
      admin: {
        description:
          'Ergibt sich aus dem Feld „Kategorie“ am jeweiligen Produkt. Die Reihenfolge auf der Kategorieseite steuert das Feld „Reihenfolge“ am Produkt.',
        defaultColumns: ['title', 'sortOrder', 'price', 'status'],
      },
      defaultSort: 'sortOrder',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Kopfbereich',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Kleine Überzeile', defaultValue: 'Bulltron Race' },
            { name: 'headline', type: 'text', label: 'Überschrift', required: true },
            { name: 'subline', type: 'textarea', label: 'Einleitungstext' },
            { name: 'image', type: 'upload', relationTo: 'media', label: 'Kopfbild' },
          ],
        },
        {
          label: 'Inhalt',
          fields: [
            {
              name: 'highlights',
              type: 'array',
              label: 'Argumente (3 Kacheln unter dem Kopfbereich)',
              maxRows: 4,
              fields: [
                { name: 'title', type: 'text', label: 'Titel', required: true },
                { name: 'text', type: 'textarea', label: 'Text' },
              ],
            },
            {
              name: 'body',
              type: 'richText',
              label: 'Fließtext unter den Produkten',
            },
            {
              name: 'faq',
              type: 'array',
              label: 'Häufige Fragen',
              fields: [
                { name: 'question', type: 'text', label: 'Frage', required: true },
                { name: 'answer', type: 'textarea', label: 'Antwort', required: true },
              ],
            },
          ],
        },
        { label: 'SEO', fields: [seoField] },
      ],
    },
  ],
}
