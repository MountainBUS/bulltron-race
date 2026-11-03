import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

/** Art der Veranstaltung. Steuert nur die Beschriftung und den Filter. */
export const ART_OPTIONEN = [
  { label: 'Rennen', value: 'rennen' },
  { label: 'Messe', value: 'messe' },
  { label: 'Trackday', value: 'trackday' },
  { label: 'Sonstiges', value: 'sonstiges' },
]

/**
 * Veranstaltungen — Rennen, Messen und Trackdays.
 *
 * EIN EINTRAG JE VERANSTALTUNG, nicht je Teilnahme. Das ist der Kern dieser
 * Sammlung: Am 11.10.2026 waren Schmechel Race Tech und R25Performance auf
 * demselben Wochenende am Nürburgring, und beide hatten es in ihrem Fragebogen
 * anders geschrieben („European Timeattack und German Timeattack" gegen
 * „German Time Attack Masters, Nürburgring"). Hingen die Termine weiter an den
 * Teams, stünde dasselbe Rennen auf der Übersicht mehrfach und jedes Mal
 * anders. Hier steht es einmal, und die Teams hängen daran.
 *
 * WAS ZUM TEAM GEHÖRT UND NICHT ZUR VERANSTALTUNG, steht in der Notiz der
 * jeweiligen Teilnahme: „Radical SR3 als Race Taxi" oder „Stand FOX
 * Exhaustsystems" beschreibt das Team an diesem Wochenende, nicht das Rennen.
 *
 * VERGANGENE VERANSTALTUNGEN BLEIBEN STEHEN. Sie verschwinden nicht wie die
 * Termine an den Teams, sondern rücken auf der Übersicht nach hinten. Deshalb
 * gibt es hier keine Automatik, die etwas ausblendet — nur den Schalter
 * „Auf der Website anzeigen".
 */
export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Veranstaltung', plural: 'Veranstaltungen' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'dateFrom', 'venue', 'kind', 'published'],
    group: 'Inhalte',
    description:
      'Rennen, Messen und Trackdays. Ein Eintrag je Veranstaltung — teilnehmende Teams werden unten angehängt, nicht als eigener Termin am Team gepflegt. Jeder Eintrag bekommt eine eigene Seite unter /veranstaltungen.',
    listSearchableFields: ['title', 'venue', 'city', 'series'],
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  /* Neueste zuerst im Backend: Dort wird meist das gepflegt, was ansteht. */
  defaultSort: '-dateFrom',
  fields: [
    { name: 'title', type: 'text', label: 'Titel der Veranstaltung', required: true },
    slugField('title'),
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
      admin: { position: 'sidebar', description: 'Erscheint mit Rahmen und ganz oben bei den kommenden Terminen.' },
    },
    {
      name: 'kind',
      type: 'select',
      label: 'Art',
      required: true,
      defaultValue: 'rennen',
      options: ART_OPTIONEN,
      admin: { position: 'sidebar' },
    },
    {
      name: 'canceled',
      type: 'checkbox',
      label: 'Abgesagt',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Der Eintrag bleibt sichtbar und wird als abgesagt gekennzeichnet. Besser als löschen, solange jemand den Termin im Kalender haben könnte.',
      },
    },

    {
      type: 'tabs',
      tabs: [
        {
          label: 'Termin und Ort',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'dateFrom',
                  type: 'date',
                  label: 'Datum (Beginn)',
                  required: true,
                  admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } },
                },
                {
                  name: 'dateTo',
                  type: 'date',
                  label: 'Datum (Ende)',
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
                    description: 'Nur bei mehrtägigen Veranstaltungen ausfüllen, etwa einem Rennwochenende oder einer Messe.',
                  },
                },
              ],
            },
            {
              name: 'series',
              type: 'text',
              label: 'Rennserie oder Veranstalter',
              admin: { description: 'Zum Beispiel „German Time Attack Masters“ oder „Essen Motor Show“.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'venue',
                  type: 'text',
                  label: 'Strecke oder Gelände',
                  admin: { width: '50%', description: 'Zum Beispiel „Hockenheimring“ oder „Messe Essen“.' },
                },
                { name: 'city', type: 'text', label: 'Ort', admin: { width: '30%' } },
                {
                  name: 'country',
                  type: 'select',
                  label: 'Land',
                  defaultValue: 'DE',
                  options: [
                    { label: 'Deutschland', value: 'DE' },
                    { label: 'Österreich', value: 'AT' },
                    { label: 'Schweiz', value: 'CH' },
                    { label: 'Niederlande', value: 'NL' },
                    { label: 'Italien', value: 'IT' },
                    { label: 'Belgien', value: 'BE' },
                    { label: 'Frankreich', value: 'FR' },
                    { label: 'Spanien', value: 'ES' },
                    { label: 'Anderes Land', value: 'XX' },
                  ],
                  admin: { width: '20%' },
                },
              ],
            },
            {
              name: 'website',
              type: 'text',
              label: 'Link zur Veranstaltung',
              admin: { description: 'Mit oder ohne https:// — wird beim Speichern ergänzt.' },
            },
          ],
        },

        {
          label: 'Bulltron Race vor Ort',
          fields: [
            {
              name: 'bulltron',
              type: 'group',
              label: ' ',
              fields: [
                {
                  name: 'present',
                  type: 'checkbox',
                  label: 'Bulltron Race ist vor Ort',
                  defaultValue: false,
                  admin: { description: 'Setzt das Kennzeichen auf der Übersicht und macht den Eintrag über den Filter auffindbar.' },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'location',
                      type: 'text',
                      label: 'Halle und Stand',
                      admin: { width: '50%', description: 'Zum Beispiel „Halle 3, Stand C24“.' },
                    },
                    {
                      name: 'contact',
                      type: 'text',
                      label: 'Ansprechpartner vor Ort',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  name: 'note',
                  type: 'textarea',
                  label: 'Hinweis',
                  admin: { description: 'Was es vor Ort gibt — Beratung, Batterien zum Mitnehmen, Vorführung. Erscheint auf der Veranstaltungsseite.' },
                },
              ],
            },
          ],
        },

        {
          label: 'Teams',
          fields: [
            {
              name: 'participants',
              type: 'array',
              label: 'Teilnehmende Teams',
              labels: { singular: 'Team', plural: 'Teams' },
              admin: {
                description:
                  'Welche unserer Rennteams hier antreten. Die Veranstaltung erscheint dadurch automatisch auf der jeweiligen Teamseite — der Termin muss dort nicht noch einmal eingetragen werden.',
              },
              fields: [
                {
                  name: 'team',
                  type: 'relationship',
                  relationTo: 'teams',
                  label: 'Team',
                  required: true,
                },
                {
                  name: 'note',
                  type: 'text',
                  label: 'Hinweis zu diesem Team',
                  admin: {
                    description:
                      'Was dieses Team hier macht, etwa „Radical SR3 als Race Taxi“ oder „Stand FOX Exhaustsystems“. Erscheint neben dem Teamnamen.',
                  },
                },
                { name: 'result', type: 'text', label: 'Ergebnis', admin: { description: 'Nach der Veranstaltung nachtragen, etwa „P1 Klasse Pro“.' } },
              ],
            },
          ],
        },

        {
          label: 'Inhalt',
          fields: [
            {
              name: 'shortDescription',
              type: 'textarea',
              label: 'Kurzbeschreibung',
              admin: { description: 'Ein bis zwei Sätze. Erscheinen auf der Übersicht und als Beschreibung in Suchergebnissen.' },
            },
            { name: 'description', type: 'richText', label: 'Beschreibung' },
            {
              name: 'mainImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Hauptbild',
              admin: { description: 'Ohne Bild bleibt auf der Übersicht der Markenhintergrund stehen.' },
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
            { name: 'internalNote', type: 'textarea', label: 'Interne Notiz', admin: { description: 'Nur im Backend sichtbar.' } },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Webadresse vervollständigen, damit der Link im Frontend funktioniert.
        if (data?.website && !/^https?:\/\//i.test(data.website)) {
          data.website = `https://${String(data.website).replace(/^\/+/, '')}`
        }

        /* Ein Ende vor dem Beginn wäre ein Tippfehler, der die Sortierung und
           die Anzeige „vom … bis …" durcheinanderbringt. Statt es stehen zu
           lassen, fällt der Eintrag auf einen eintägigen Termin zurück. */
        if (data?.dateFrom && data?.dateTo) {
          const von = new Date(data.dateFrom).getTime()
          const bis = new Date(data.dateTo).getTime()
          if (Number.isFinite(von) && Number.isFinite(bis) && bis < von) data.dateTo = null
        }

        return data
      },
    ],
  },
}
