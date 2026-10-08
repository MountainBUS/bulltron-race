import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Website-Einstellungen',
  admin: {
    group: 'Inhalte',
    description: 'Logo, Navigation, Footer, Kontaktdaten, Versandkosten.',
  },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Allgemein',
          fields: [
            { name: 'siteName', type: 'text', label: 'Seitenname', defaultValue: 'BULLTRON RACE' },
            { name: 'tagline', type: 'text', label: 'Claim', defaultValue: 'Faster is always better.' },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Logo (Kopfbereich)',
              admin: { description: 'Kompakte Fassung ohne Claim — im Header ist wenig Höhe.' },
            },
            {
              name: 'footerLogo',
              type: 'upload',
              relationTo: 'media',
              label: 'Logo (Footer)',
              admin: { description: 'Darf die vollständige Fassung mit Claim sein. Leer lassen, dann wird das Kopf-Logo verwendet.' },
            },
            { name: 'defaultSeoDescription', type: 'textarea', label: 'Standard-Meta-Beschreibung' },
            { name: 'defaultSeoImage', type: 'upload', relationTo: 'media', label: 'Standard-Sharing-Bild' },
          ],
        },
        {
          label: 'Navigation',
          fields: [
            {
              name: 'mainNav',
              type: 'array',
              label: 'Hauptnavigation',
              fields: [
                { name: 'label', type: 'text', label: 'Beschriftung', required: true, admin: { width: '50%' } },
                { name: 'url', type: 'text', label: 'Ziel', required: true, admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'headerCtaLabel', type: 'text', label: 'Header-Button — Text', defaultValue: 'Jetzt beraten lassen', admin: { width: '50%' } },
                { name: 'headerCtaUrl', type: 'text', label: 'Header-Button — Ziel', defaultValue: 'tel:+4936134948420', admin: { width: '50%' } },
              ],
            },
            { name: 'announcement', type: 'text', label: 'Hinweisleiste über dem Header', admin: { description: 'Leer lassen zum Ausblenden.' } },
          ],
        },
        {
          label: 'Kontakt',
          fields: [
            { name: 'companyName', type: 'text', label: 'Firma', defaultValue: 'ProVerDa GmbH' },
            { name: 'street', type: 'text', label: 'Straße', defaultValue: 'An der Lache 40-42' },
            {
              type: 'row',
              fields: [
                { name: 'postalCode', type: 'text', label: 'PLZ', defaultValue: '99086', admin: { width: '30%' } },
                { name: 'city', type: 'text', label: 'Ort', defaultValue: 'Erfurt', admin: { width: '70%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', label: 'Telefon', defaultValue: '+49 361 34948420', admin: { width: '33%' } },
                { name: 'mobile', type: 'text', label: 'Mobil', defaultValue: '+49 157 53705942', admin: { width: '33%' } },
                { name: 'email', type: 'text', label: 'E-Mail', defaultValue: 'info@bulltron-race.de', admin: { width: '34%' } },
              ],
            },
            { name: 'openingHours', type: 'text', label: 'Erreichbarkeit', admin: { description: 'Erscheint im Footer. Leer lassen, wenn keine festen Zeiten genannt werden sollen.' } },

            /* --- Angaben für die Rechnung ---------------------------------
               Diese Daten standen bisher nur als Fließtext im Impressum. Eine
               Rechnung muss sie nach § 14 UStG führen, und zwar als Angaben,
               die sich hier ändern lassen — fest im Code wären sie bei der
               nächsten Änderung an zwei Stellen zu pflegen und an einer davon
               vergessen. */
            {
              type: 'row',
              fields: [
                {
                  name: 'vatId',
                  type: 'text',
                  label: 'Umsatzsteuer-Identifikationsnummer',
                  defaultValue: 'DE815509556',
                  admin: { width: '50%', description: 'Steht auf jeder Rechnung. Muss mit dem Impressum übereinstimmen.' },
                },
                {
                  name: 'taxNumber',
                  type: 'text',
                  label: 'Steuernummer',
                  admin: { width: '50%', description: 'Nur nötig, wenn keine Umsatzsteuer-ID vorliegt. Eine der beiden Angaben muss auf der Rechnung stehen.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'registerCourt', type: 'text', label: 'Registergericht', defaultValue: 'Amtsgericht Jena', admin: { width: '50%' } },
                { name: 'registerNumber', type: 'text', label: 'Registernummer', defaultValue: 'HRB 510004', admin: { width: '50%' } },
              ],
            },
            {
              name: 'managingDirector',
              type: 'text',
              label: 'Geschäftsführung',
              admin: { description: 'Erscheint im Fuß der Rechnung. Leer lassen, dann steht dort nichts.' },
            },
            {
              name: 'invoiceNote',
              type: 'textarea',
              label: 'Schlusstext auf der Rechnung',
              defaultValue:
                'Der Rechnungsbetrag ist bereits bezahlt. Die Lieferung erfolgt innerhalb von 2 bis 4 Werktagen.',
              admin: { description: 'Steht unter der Betragsaufstellung. Hier gehört hin, was für jede Rechnung gilt.' },
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            { name: 'footerText', type: 'textarea', label: 'Text in der ersten Footer-Spalte' },
            {
              name: 'footerColumns',
              type: 'array',
              label: 'Footer-Spalten',
              maxRows: 3,
              fields: [
                { name: 'title', type: 'text', label: 'Spaltentitel', required: true },
                {
                  name: 'links',
                  type: 'array',
                  label: 'Links',
                  fields: [
                    { name: 'label', type: 'text', label: 'Beschriftung', required: true, admin: { width: '50%' } },
                    { name: 'url', type: 'text', label: 'Ziel', required: true, admin: { width: '50%' } },
                  ],
                },
              ],
            },
            { name: 'copyright', type: 'text', label: 'Copyright-Zeile', defaultValue: '© BULLTRON GmbH' },
            {
              name: 'paymentNote',
              type: 'text',
              label: 'Zahlungshinweis im Footer',
              defaultValue: 'Sichere Zahlung über Stripe — Kreditkarte, Apple Pay, Google Pay, Klarna',
            },
          ],
        },
        {
          label: 'Shop & Versand',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'shippingCost', type: 'number', label: 'Versandkosten (€)', defaultValue: 17.9, admin: { width: '33%', step: 0.01, description: 'Standardversand als Gefahrgut, von Bulltron mit 17,90 € angegeben. Dieser Betrag wird beim Kauf tatsächlich abgebucht.' } },
                { name: 'freeShippingFrom', type: 'number', label: 'Versandfrei ab (€)', defaultValue: 0, admin: { width: '33%', step: 0.01, description: '0 = nie versandfrei. Eine Freigrenze ist eine Zusage an den Kunden — nur eintragen, wenn sie wirklich gilt.' } },
                { name: 'taxRate', type: 'number', label: 'MwSt.-Satz (%)', defaultValue: 19, admin: { width: '34%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'deliveryDaysMin', type: 'number', label: 'Lieferzeit von (Werktage)', admin: { width: '50%', description: 'Erscheint auf der Stripe-Bezahlseite. Beide Felder leer lassen, wenn keine Lieferzeit zugesagt werden soll — dann steht dort nichts.' } },
                { name: 'deliveryDaysMax', type: 'number', label: 'Lieferzeit bis (Werktage)', admin: { width: '50%' } },
              ],
            },
            {
              name: 'shippingCountries',
              type: 'array',
              label: 'Lieferländer',
              admin: { description: 'ISO-Code, z. B. DE, AT, CH.' },
              fields: [
                { name: 'code', type: 'text', label: 'Ländercode', required: true, maxLength: 2, admin: { width: '30%' } },
                { name: 'name', type: 'text', label: 'Land', required: true, admin: { width: '70%' } },
              ],
            },
            { name: 'checkoutNote', type: 'textarea', label: 'Hinweis im Warenkorb' },
            {
              name: 'sellerNotice',
              type: 'group',
              label: 'Hinweis auf den Verkäufer',
              admin: {
                description:
                  'Erscheint hervorgehoben im Warenkorb, auf der Kasse, auf der Bestellbestätigung und in der Bestätigungsmail. Zweck: Der Kunde soll beim Kauf nicht darüber stolpern, dass Marke und Verkäufer nicht dieselbe Firma sind. Beide Felder leer lassen blendet den Hinweis überall aus.',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: 'Überschrift',
                  defaultValue: 'Versand und Rechnung über die ProVerDa GmbH',
                },
                {
                  name: 'text',
                  type: 'textarea',
                  label: 'Text',
                  defaultValue:
                    'Diesen Shop betreibt die ProVerDa GmbH. Sie ist Ihre Vertragspartnerin, übernimmt Versand und Distribution und stellt Ihnen die Rechnung. Die Batterien der Marke BULLTRON RACE werden von der BULLTRON GmbH verantwortet.',
                },
              ],
            },
            {
              name: 'legal',
              type: 'group',
              label: 'Rechtliche Pflichtangaben',
              fields: [
                { name: 'priceNote', type: 'text', label: 'Preishinweis', defaultValue: 'Alle Preise inkl. gesetzlicher MwSt., zzgl. Versandkosten.' },
                { name: 'termsUrl', type: 'text', label: 'AGB-Seite', defaultValue: '/agb' },
                { name: 'privacyUrl', type: 'text', label: 'Datenschutzseite', defaultValue: '/datenschutz' },
                { name: 'imprintUrl', type: 'text', label: 'Impressum', defaultValue: '/impressum' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
