import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Medium', plural: 'Medien' },
  admin: { group: 'Inhalte' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    // Im Container liegen die Uploads auf einem eigenen Volume (MEDIA_DIR),
    // damit sie ein Update des Images überleben.
    staticDir: process.env.MEDIA_DIR || 'public/media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 480, height: undefined, position: 'centre' },
      { name: 'card', width: 900, height: undefined, position: 'centre' },
      { name: 'hero', width: 1800, height: undefined, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alternativtext',
      required: true,
      admin: { description: 'Kurze Bildbeschreibung — wichtig für SEO und Barrierefreiheit.' },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Bildunterschrift',
    },
  ],
}
