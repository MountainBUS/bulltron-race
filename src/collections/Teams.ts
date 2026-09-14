import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

/**
 * Rennteams und ihre Fahrer.
 *
 * Die Feldstruktur folgt eins zu eins dem Fragebogen, den Bulltron an die
 * Teams verschickt. Deshalb ist bis auf den Teamnamen nichts Pflicht: ein Team
 * darf den Bogen halb ausgefüllt zurückschicken. Im Frontend erscheint
 * ausschließlich, was tatsächlich befüllt ist — leere Felder erzeugen keine
 * leeren Überschriften.
 */
export const Teams: CollectionConfig = {
  slug: 'teams',
  labels: { singular: 'Rennteam', plural: 'Rennteams' },
  admin: {
    useAsTitle: 'teamName',
    defaultColumns: ['teamName', 'location', 'series', 'published'],
    group: 'Inhalte',
    description:
      'Ein Eintrag je Rennteam, entsprechend dem Fragebogen. Jeder Eintrag bekommt eine eigene Seite unter /teams. Felder, die leer bleiben, erscheinen auf der Seite nicht — es ist also kein Problem, einen Bogen nur teilweise ausgefüllt zu übernehmen.',
    listSearchableFields: ['teamName', 'location', 'series'],
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'teamName',
  fields: [
    { name: 'teamName', type: 'text', label: 'Name des Rennteams', required: true },
    slugField('teamName'),
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
      admin: { position: 'sidebar', description: 'Erscheint in der Übersicht ganz oben und mit Rahmen.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Reihenfolge',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Kleinere Zahl steht weiter vorn. Bei gleicher Zahl zählt der Teamname.' },
    },

    {
      type: 'tabs',
      tabs: [
        /* ------------------------------------------------ 1. Team --------- */
        {
          label: 'Team und Fahrer',
          fields: [
            {
              name: 'drivers',
              type: 'array',
              label: 'Fahrer',
              labels: { singular: 'Fahrer', plural: 'Fahrer' },
              admin: { description: 'Je Fahrer ein Eintrag. Erscheint auf der Teamseite und in der Übersicht.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Name', required: true, admin: { width: '60%' } },
                    {
                      name: 'role',
                      type: 'text',
                      label: 'Rolle',
                      admin: { width: '40%', description: 'Optional, z. B. „Stammfahrer“ oder „Teamchef“.' },
                    },
                  ],
                },
                { name: 'photo', type: 'upload', relationTo: 'media', label: 'Foto' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'location', type: 'text', label: 'Standort / Heimatort', admin: { width: '50%' } },
                { name: 'series', type: 'text', label: 'Rennserie / Klasse', admin: { width: '50%' } },
              ],
            },
            {
              name: 'intro',
              type: 'richText',
              label: 'Kurze Vorstellung',
              admin: {
                description:
                  'Wer seid ihr, wie seid ihr zum Rennsport gekommen und was zeichnet euch aus? Antwort des Teams, bitte nicht umschreiben.',
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'contactName', type: 'text', label: 'Ansprechpartner für Rückfragen', admin: { width: '50%' } },
                { name: 'contactEmail', type: 'email', label: 'E-Mail des Ansprechpartners', admin: { width: '50%' } },
              ],
            },
            {
              name: 'contactPublic',
              type: 'checkbox',
              label: 'Ansprechpartner öffentlich zeigen',
              defaultValue: false,
              admin: {
                description:
                  'Aus: Name und E-Mail stehen nur im Backend. An: beides erscheint auf der Teamseite. Bitte nur mit Einverständnis des Teams einschalten.',
              },
            },
            { name: 'website', type: 'text', label: 'Webseite des Teams', admin: { description: 'Mit oder ohne https:// — wird beim Speichern ergänzt.' } },
            {
              name: 'social',
              type: 'array',
              label: 'Weitere Links',
              labels: { singular: 'Link', plural: 'Links' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', label: 'Beschriftung', required: true, admin: { width: '40%' } },
                    { name: 'url', type: 'text', label: 'Adresse', required: true, admin: { width: '60%' } },
                  ],
                },
              ],
            },
          ],
        },

        /* ------------------------------------------------ 2. Fahrzeuge ---- */
        {
          label: 'Fahrzeuge und Batterien',
          fields: [
            {
              name: 'vehicles',
              type: 'array',
              label: 'Fahrzeuge',
              labels: { singular: 'Fahrzeug', plural: 'Fahrzeuge' },
              admin: {
                description: 'Setzt das Team mehrere Fahrzeuge ein, bekommt jedes einen eigenen Eintrag.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'manufacturer', type: 'text', label: 'Hersteller', admin: { width: '40%' } },
                    { name: 'model', type: 'text', label: 'Modell', admin: { width: '40%' } },
                    { name: 'year', type: 'text', label: 'Baujahr', admin: { width: '20%' } },
                  ],
                },
                { name: 'engine', type: 'text', label: 'Motor / Hubraum / Leistung' },
                { name: 'modifications', type: 'textarea', label: 'Besonderheiten oder Umbauten' },
                {
                  name: 'battery',
                  type: 'relationship',
                  relationTo: 'products',
                  label: 'Eingesetztes Bulltron-Batteriemodell',
                  admin: {
                    description:
                      'Verknüpft die Teamseite mit der Produktseite. Steht das Modell nicht zur Auswahl, das Feld darunter benutzen.',
                  },
                },
                {
                  name: 'batteryOther',
                  type: 'text',
                  label: 'Batteriemodell (Freitext)',
                  admin: {
                    description: 'Nur nötig, wenn das eingesetzte Modell nicht im Shop steht — etwa eine Sonderanfertigung.',
                  },
                },
                { name: 'since', type: 'text', label: 'Im Einsatz seit', admin: { description: 'So, wie das Team es angegeben hat, z. B. „Saison 2024“ oder „März 2025“.' } },
                { name: 'reason', type: 'textarea', label: 'Warum Bulltron?' },
                { name: 'experience', type: 'textarea', label: 'Erfahrungen im Rennbetrieb' },
                { name: 'photo', type: 'upload', relationTo: 'media', label: 'Foto des Fahrzeugs' },
              ],
            },
          ],
        },

        /* ------------------------------------------------ 3. Erfolge ------ */
        {
          label: 'Erfolge und Termine',
          fields: [
            {
              name: 'results',
              type: 'array',
              label: 'Ergebnisse der aktuellen Saison',
              labels: { singular: 'Ergebnis', plural: 'Ergebnisse' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'date', type: 'date', label: 'Datum', admin: { width: '25%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
                    { name: 'event', type: 'text', label: 'Veranstaltung', required: true, admin: { width: '50%' } },
                    { name: 'placement', type: 'text', label: 'Platzierung', admin: { width: '25%' } },
                  ],
                },
              ],
            },
            {
              name: 'pastAchievements',
              type: 'array',
              label: 'Besondere Erfolge aus vergangenen Jahren',
              labels: { singular: 'Erfolg', plural: 'Erfolge' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'year', type: 'text', label: 'Jahr', admin: { width: '20%' } },
                    { name: 'title', type: 'text', label: 'Erfolg', required: true, admin: { width: '80%' } },
                  ],
                },
              ],
            },
            {
              name: 'upcoming',
              type: 'array',
              label: 'Kommende Renntermine',
              labels: { singular: 'Termin', plural: 'Termine' },
              admin: { description: 'Vergangene Termine verschwinden auf der Website von selbst, sobald das Datum vorbei ist.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'date', type: 'date', label: 'Datum', required: true, admin: { width: '30%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
                    { name: 'event', type: 'text', label: 'Veranstaltung', required: true, admin: { width: '70%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'track', type: 'text', label: 'Rennstrecke / Ort', admin: { width: '50%' } },
                    { name: 'url', type: 'text', label: 'Link zur Veranstaltung', admin: { width: '50%' } },
                  ],
                },
              ],
            },
          ],
        },

        /* ------------------------------------------------ Bilder ---------- */
        {
          label: 'Bilder und Notizen',
          fields: [
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Teamlogo' },
            {
              name: 'mainImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Hauptbild',
              admin: { description: 'Erscheint in der Übersicht und oben auf der Teamseite. Ohne Bild bleibt dort der Markenhintergrund.' },
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'Weitere Bilder',
              labels: { singular: 'Bild', plural: 'Bilder' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', label: 'Bild', required: true },
                { name: 'caption', type: 'text', label: 'Bildunterschrift' },
              ],
            },
            {
              name: 'internalNote',
              type: 'textarea',
              label: 'Interne Notiz',
              admin: { description: 'Nur im Backend sichtbar, erscheint nicht auf der Website.' },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        const vervollstaendigen = (wert: unknown): string | undefined => {
          if (typeof wert !== 'string' || wert.trim() === '') return undefined
          return /^https?:\/\//i.test(wert) ? wert : `https://${wert.replace(/^\/+/, '')}`
        }

        const web = vervollstaendigen(data?.website)
        if (web) data.website = web

        if (Array.isArray(data?.social)) {
          data.social = data.social.map((eintrag: Record<string, unknown>) => ({
            ...eintrag,
            url: vervollstaendigen(eintrag?.url) ?? eintrag?.url,
          }))
        }
        if (Array.isArray(data?.upcoming)) {
          data.upcoming = data.upcoming.map((eintrag: Record<string, unknown>) => ({
            ...eintrag,
            url: vervollstaendigen(eintrag?.url) ?? eintrag?.url,
          }))
        }

        return data
      },
    ],
  },
}
