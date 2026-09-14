import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { koordinatenZuPlz } from '../lib/geo-server'

/** Statuswerte, nach denen auf der Händlerseite gefiltert werden kann. */
export const STATUS_OPTIONEN = [
  { label: 'Händler', value: 'haendler' },
  { label: 'Einbaupartner', value: 'einbaupartner' },
]

export const Dealers: CollectionConfig = {
  slug: 'dealers',
  labels: { singular: 'Händler', plural: 'Händler' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'status', 'published'],
    group: 'Shop',
    description:
      'Händler und Einbaupartner. Die Koordinaten für die Umkreissuche werden beim Speichern automatisch aus der Postleitzahl ermittelt (Deutschland, Österreich, Schweiz).',
    listSearchableFields: ['name', 'city', 'postalCode'],
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'name',
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Webadresse vervollständigen, damit der Link im Frontend funktioniert.
        if (data?.website && !/^https?:\/\//i.test(data.website)) {
          data.website = `https://${String(data.website).replace(/^\/+/, '')}`
        }

        // Koordinaten aus der Postleitzahl ermitteln — außer sie wurden von
        // Hand gesetzt. Die Tabelle kennt Deutschland, Österreich und die
        // Schweiz.
        const koordinaten = data?.coordinates ?? {}
        const vonHand = koordinaten.manuell === true
        const hatWerte = typeof koordinaten.lat === 'number' && typeof koordinaten.lng === 'number'

        if (!vonHand) {
          const treffer = koordinatenZuPlz(data?.postalCode, data?.country ?? 'DE')
          if (treffer) {
            data.coordinates = { ...koordinaten, lat: treffer.lat, lng: treffer.lng }
          } else if (!hatWerte) {
            data.coordinates = { ...koordinaten, lat: null, lng: null }
          }
        }

        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Name des Betriebs', required: true },
    slugField('name'),
    {
      name: 'published',
      type: 'checkbox',
      label: 'Auf der Website anzeigen',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Hervorheben',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Erscheint mit Rahmen und weiter oben in der Liste.' },
    },
    {
      name: 'status',
      type: 'select',
      hasMany: true,
      label: 'Status',
      required: true,
      defaultValue: ['haendler'],
      options: STATUS_OPTIONEN,
      admin: { position: 'sidebar', description: 'Mehrfachauswahl möglich.' },
    },
    {
      name: 'statusFreitext',
      type: 'text',
      label: 'Zusätzlicher Status (Freitext)',
      admin: {
        position: 'sidebar',
        description: 'Eigene Bezeichnung, z. B. „Servicepartner“ oder „Schulungszentrum“. Erscheint als weiteres Etikett und ist mitfilterbar.',
      },
    },

    {
      type: 'tabs',
      tabs: [
        {
          label: 'Anschrift',
          fields: [
            { name: 'street', type: 'text', label: 'Straße und Hausnummer' },
            {
              type: 'row',
              fields: [
                { name: 'postalCode', type: 'text', label: 'PLZ', admin: { width: '30%' } },
                { name: 'city', type: 'text', label: 'Ort', admin: { width: '45%' } },
                {
                  name: 'country',
                  type: 'select',
                  label: 'Land',
                  defaultValue: 'DE',
                  options: [
                    { label: 'Deutschland', value: 'DE' },
                    { label: 'Österreich', value: 'AT' },
                    { label: 'Schweiz', value: 'CH' },
                  ],
                  admin: { width: '25%' },
                },
              ],
            },
            {
              name: 'coordinates',
              type: 'group',
              label: 'Koordinaten',
              admin: {
                description:
                  'Werden beim Speichern aus der Postleitzahl ermittelt — für Deutschland, Österreich und die Schweiz. Für eine genauere Position hier von Hand eintragen und den Haken darunter setzen, dann bleiben die Werte unangetastet.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'lat', type: 'number', label: 'Breitengrad', admin: { width: '50%', step: 0.0001 } },
                    { name: 'lng', type: 'number', label: 'Längengrad', admin: { width: '50%', step: 0.0001 } },
                  ],
                },
                {
                  name: 'manuell',
                  type: 'checkbox',
                  label: 'Koordinaten von Hand gesetzt',
                  defaultValue: false,
                  admin: { description: 'Verhindert, dass die automatische Ermittlung sie beim Speichern überschreibt.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Kontakt',
          fields: [
            { name: 'contactPerson', type: 'text', label: 'Ansprechpartner' },
            {
              type: 'row',
              fields: [
                { name: 'email', type: 'email', label: 'E-Mail', admin: { width: '50%' } },
                { name: 'phone', type: 'text', label: 'Telefon', admin: { width: '50%' } },
              ],
            },
            {
              name: 'website',
              type: 'text',
              label: 'Webseite',
              admin: { description: 'Mit oder ohne https:// — wird beim Speichern ergänzt.' },
            },
            { name: 'openingHours', type: 'textarea', label: 'Öffnungszeiten', admin: { description: 'Eine Zeile je Tag oder Zeitraum.' } },
          ],
        },
        {
          label: 'Leistungen',
          fields: [
            {
              name: 'services',
              type: 'select',
              hasMany: true,
              label: 'Leistungen vor Ort',
              options: [
                { label: 'Beratung', value: 'beratung' },
                { label: 'Einbau', value: 'einbau' },
                { label: 'Werkstatt', value: 'werkstatt' },
                { label: 'Abholung möglich', value: 'abholung' },
                { label: 'Vor-Ort-Service', value: 'vorort' },
              ],
            },
            { name: 'description', type: 'textarea', label: 'Kurzbeschreibung', admin: { description: 'Zwei bis drei Sätze, erscheinen auf der Karte des Händlers.' } },
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
            { name: 'internalNote', type: 'textarea', label: 'Interne Notiz', admin: { description: 'Nur im Backend sichtbar, erscheint nicht auf der Website.' } },
          ],
        },
      ],
    },
  ],
}
