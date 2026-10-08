import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'

/**
 * Gutscheincodes für den Warenkorb.
 *
 * NICHT ÖFFENTLICH LESBAR: `read` steht auf `authenticated`, nicht auf
 * `anyone` wie bei Produkten. Sonst könnte jeder über die Payload-API
 * sämtliche Codes auflisten und bräuchte gar keinen geschenkt zu bekommen.
 * Die Prüfroute des Shops liest mit `overrideAccess: true` und gibt nur
 * zurück, ob der eingegebene Code gilt und wie viel er abzieht.
 *
 * DER RABATT WIRD NIE IM BROWSER BERECHNET. Der Warenkorb zeigt nur an, was
 * der Server ihm sagt, und beim Anlegen der Stripe-Sitzung rechnet der Server
 * erneut — mit den Preisen aus der Datenbank. Eine im Browser veränderte Zahl
 * kommt damit nirgends an.
 */
export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: { singular: 'Gutschein', plural: 'Gutscheine' },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'kind', 'active', 'validUntil', 'redemptions'],
    group: 'Shop',
    description:
      'Codes, die Kundinnen und Kunden im Warenkorb eingeben können. Ein Code wirkt erst, wenn der Haken „Aktiv" gesetzt ist und alle Bedingungen erfüllt sind.',
    listSearchableFields: ['code'],
  },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'code',
      type: 'text',
      label: 'Code',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Was der Kunde eintippt. Groß- und Kleinschreibung spielt keine Rolle, der Code wird beim Speichern in Großbuchstaben umgewandelt. Leerzeichen werden entfernt.',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value),
        ],
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Aktiv',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Aus: Der Code wird abgelehnt, egal was sonst eingestellt ist. So lässt sich ein Code sofort stoppen.',
      },
    },
    {
      name: 'redemptions',
      type: 'number',
      label: 'Bereits eingelöst',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Zählt erst hoch, wenn eine Zahlung tatsächlich durch ist — nicht schon beim Eintippen.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Rabatt',
          fields: [
            {
              name: 'kind',
              type: 'select',
              label: 'Art des Rabatts',
              required: true,
              defaultValue: 'percent',
              options: [
                { label: 'Prozent vom Warenwert', value: 'percent' },
                { label: 'Fester Betrag', value: 'amount' },
                { label: 'Versandkostenfrei', value: 'shipping' },
              ],
            },
            {
              name: 'percent',
              type: 'number',
              label: 'Prozent',
              min: 1,
              max: 100,
              admin: {
                step: 1,
                condition: (data) => data?.kind === 'percent',
                description: 'Zum Beispiel 10 für zehn Prozent. Der Versand bleibt davon unberührt.',
              },
            },
            {
              name: 'amount',
              type: 'number',
              label: 'Betrag (€)',
              min: 0,
              admin: {
                step: 0.01,
                condition: (data) => data?.kind === 'amount',
                description:
                  'Zum Beispiel 25 für 25 Euro Nachlass. Ist der Warenkorb günstiger als der Betrag, wird höchstens der Warenwert abgezogen — es gibt nie Geld zurück.',
              },
            },
          ],
        },
        {
          label: 'Bedingungen',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'validFrom',
                  type: 'date',
                  label: 'Gültig ab',
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
                    description: 'Leer lassen für sofort.',
                  },
                },
                {
                  name: 'validUntil',
                  type: 'date',
                  label: 'Gültig bis',
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
                    description: 'Einschließlich dieses Tages. Leer lassen für unbegrenzt.',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'minOrderValue',
                  type: 'number',
                  label: 'Mindestbestellwert (€)',
                  min: 0,
                  admin: {
                    width: '50%',
                    step: 0.01,
                    description:
                      'Gemessen am Warenwert ohne Versand. Bei Codes für bestimmte Produkte zählt nur der Teil des Warenkorbs, für den der Code gilt.',
                  },
                },
                {
                  name: 'maxRedemptions',
                  type: 'number',
                  label: 'Höchstzahl Einlösungen',
                  min: 1,
                  admin: {
                    width: '50%',
                    step: 1,
                    description: 'Leer lassen für unbegrenzt. Gezählt werden nur bezahlte Bestellungen.',
                  },
                },
              ],
            },
            {
              name: 'products',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Nur für diese Produkte',
              admin: {
                description:
                  'Leer lassen, dann gilt der Code für das ganze Sortiment. Sind hier oder bei den Kategorien Einträge gesetzt, wird der Rabatt nur auf die passenden Artikel im Warenkorb gerechnet.',
              },
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              label: 'Nur für diese Kategorien',
              admin: {
                description:
                  'Wirkt wie die Produktliste darüber, nur für ganze Kategorien. Beides zusammen ist ein Oder: Ein Artikel zählt, wenn er in der Produktliste steht oder in einer der Kategorien.',
              },
            },
          ],
        },
        {
          label: 'Notiz',
          fields: [
            {
              name: 'internalNote',
              type: 'textarea',
              label: 'Interne Notiz',
              admin: { description: 'Wofür der Code gedacht ist, wer ihn bekommen hat. Nur im Backend sichtbar.' },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        /* Die Felder, die zur gewählten Rabattart nicht gehören, werden
           geleert. Sonst bleibt beim Umstellen von „Prozent" auf „Betrag" der
           alte Prozentwert stehen, ist im Formular nicht mehr zu sehen und
           sorgt später für Ratlosigkeit. */
        if (data.kind !== 'percent') data.percent = null
        if (data.kind !== 'amount') data.amount = null
        return data
      },
    ],
  },
}
