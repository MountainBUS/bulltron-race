import type { Field } from 'payload'

export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: { description: 'Optional. Bleibt ein Feld leer, wird automatisch der Seiteninhalt verwendet.' },
  fields: [
    { name: 'title', type: 'text', label: 'Meta-Titel', maxLength: 70 },
    { name: 'description', type: 'textarea', label: 'Meta-Beschreibung', maxLength: 180 },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Social-Sharing-Bild' },
    { name: 'noindex', type: 'checkbox', label: 'Von Suchmaschinen ausschließen', defaultValue: false },
  ],
}
