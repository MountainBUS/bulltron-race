import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'

/** Einmal festgelegt, damit Originalbild und abgeleitete Größen nicht
    auseinanderlaufen können. */
const WEBP = { format: 'webp', options: { quality: 82 } } as const

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
    /* Produktfotos lagen als PNG im Volume. PNG ist verlustfrei und speichert
       jedes Sensorrauschen mit: Das 12-Ah-Bild wog 891 KB, dieselbe Darstellung
       als WebP 44 KB. Gemessen am 13.10.2026 an den echten Dateien, nicht
       geschätzt.

       WebP statt AVIF, weil WebP seit Jahren von jedem Browser gelesen wird,
       den dieser Shop bedient, und sharp es deutlich schneller kodiert.

       Qualität 82 ist ein Kompromiss: Bei 80 zeigten die dunklen Verläufe auf
       den Batteriegehäusen sichtbare Stufen.

       ACHTUNG: Die Angabe gilt NICHT für die abgeleiteten Größen — die brauchen
       laut Payload-Dokumentation jede ihre eigene. Fehlt sie dort, bleibt die
       Großansicht WebP und die Kachel darunter ein PNG. */
    formatOptions: WEBP,
    imageSizes: [
      { name: 'thumbnail', width: 480, height: undefined, position: 'centre', formatOptions: WEBP },
      { name: 'card', width: 900, height: undefined, position: 'centre', formatOptions: WEBP },
      { name: 'hero', width: 1800, height: undefined, position: 'centre', formatOptions: WEBP },
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
