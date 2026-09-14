import type { Field } from 'payload'

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  label: 'URL-Pfad (Slug)',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Wird automatisch aus dem Titel erzeugt, kann aber überschrieben werden.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.length > 0) return slugify(value)
        if (data?.[from]) return slugify(String(data[from]))
        return value
      },
    ],
  },
})

export { slugify }
