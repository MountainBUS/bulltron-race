import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { seoField } from '../fields/seo'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Seite', plural: 'Seiten' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Inhalte',
    description: 'Freie Textseiten wie Datenschutz, Impressum und AGB.',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', type: 'text', label: 'Titel', required: true },
    slugField(),
    { name: 'subtitle', type: 'text', label: 'Untertitel' },
    { name: 'lastUpdated', type: 'date', label: 'Stand vom', admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
    { name: 'content', type: 'richText', label: 'Inhalt', required: true },
    seoField,
  ],
}
