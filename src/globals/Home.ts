import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { seoField } from '../fields/seo'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Startseite',
  admin: {
    group: 'Inhalte',
    description: 'Sämtliche Inhalte der Startseite — Hero, Teaser, Videos, Vorteile, Partner.',
  },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Überzeile', defaultValue: 'Made in Germany' },
            { name: 'headline', type: 'text', label: 'Überschrift', required: true },
            { name: 'headlineAccent', type: 'text', label: 'Hervorgehobener Teil der Überschrift', admin: { description: 'Dieser Textteil wird in Bulltron-Grün gesetzt. Muss exakt so in der Überschrift vorkommen.' } },
            { name: 'subline', type: 'textarea', label: 'Fließtext unter der Überschrift' },
            {
              type: 'row',
              fields: [
                { name: 'primaryCtaLabel', type: 'text', label: 'Button 1 — Text', defaultValue: 'Batterien ansehen', admin: { width: '25%' } },
                { name: 'primaryCtaUrl', type: 'text', label: 'Button 1 — Ziel', defaultValue: '/produkte', admin: { width: '25%' } },
                { name: 'secondaryCtaLabel', type: 'text', label: 'Button 2 — Text', defaultValue: 'Beratung anrufen', admin: { width: '25%' } },
                { name: 'secondaryCtaUrl', type: 'text', label: 'Button 2 — Ziel', defaultValue: 'tel:+4936134948420', admin: { width: '25%' } },
              ],
            },
            {
              name: 'backgroundImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Hintergrundbild (vollflächig)',
              admin: {
                description:
                  'Füllt den gesamten Hero-Bereich. Ist ein Bild gesetzt, entfällt der Produktfreisteller rechts. Querformat, mindestens 2000 px breit.',
              },
            },
            {
              name: 'backgroundFocus',
              type: 'select',
              label: 'Bildausschnitt',
              defaultValue: 'center-right',
              admin: {
                description: 'Welcher Teil des Bildes sichtbar bleibt, wenn der Bereich schmaler wird.',
              },
              options: [
                { label: 'Links', value: 'left' },
                { label: 'Mitte links', value: 'center-left' },
                { label: 'Mitte', value: 'center' },
                { label: 'Mitte rechts', value: 'center-right' },
                { label: 'Rechts', value: 'right' },
              ],
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Produktfreisteller (ohne Hintergrundbild)',
              admin: { description: 'Wird nur angezeigt, solange kein Hintergrundbild gesetzt ist.' },
            },
            {
              name: 'stats',
              type: 'array',
              label: 'Kennzahlen-Leiste',
              maxRows: 4,
              fields: [
                { name: 'value', type: 'text', label: 'Wert', required: true, admin: { width: '40%' } },
                { name: 'label', type: 'text', label: 'Bezeichnung', required: true, admin: { width: '60%' } },
              ],
            },
          ],
        },
        {
          label: 'Teaser',
          fields: [
            {
              name: 'teaser',
              type: 'group',
              label: 'Teaser-Block',
              fields: [
                { name: 'enabled', type: 'checkbox', label: 'Teaser anzeigen', defaultValue: true },
                { name: 'eyebrow', type: 'text', label: 'Überzeile' },
                { name: 'headline', type: 'text', label: 'Überschrift' },
                { name: 'text', type: 'richText', label: 'Text' },
                { name: 'image', type: 'upload', relationTo: 'media', label: 'Bild' },
                {
                  name: 'imagePosition',
                  type: 'select',
                  label: 'Bildposition',
                  defaultValue: 'right',
                  options: [
                    { label: 'Rechts', value: 'right' },
                    { label: 'Links', value: 'left' },
                  ],
                },
                {
                  name: 'bullets',
                  type: 'array',
                  label: 'Stichpunkte',
                  fields: [{ name: 'text', type: 'text', label: 'Text', required: true }],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'ctaLabel', type: 'text', label: 'Button-Text', admin: { width: '50%' } },
                    { name: 'ctaUrl', type: 'text', label: 'Button-Ziel', admin: { width: '50%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Kategorien',
          fields: [
            { name: 'categoriesHeadline', type: 'text', label: 'Überschrift', defaultValue: 'Für jede Disziplin die passende Batterie' },
            { name: 'categoriesSubline', type: 'textarea', label: 'Einleitungstext' },
            {
              name: 'categoryCards',
              type: 'array',
              label: 'Kategorie-Kacheln',
              maxRows: 3,
              fields: [
                { name: 'category', type: 'relationship', relationTo: 'categories', label: 'Kategorie', required: true },
                { name: 'text', type: 'textarea', label: 'Abweichender Text (optional)' },
                { name: 'image', type: 'upload', relationTo: 'media', label: 'Bild (optional)' },
              ],
            },
          ],
        },
        {
          label: 'Produkte',
          fields: [
            { name: 'productsHeadline', type: 'text', label: 'Überschrift', defaultValue: 'Aus dem Programm' },
            { name: 'productsSubline', type: 'textarea', label: 'Einleitungstext' },
            {
              name: 'featuredProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Produkte auf der Startseite',
              admin: { description: 'Die Startseite zeigt höchstens drei Produkte. Leer lassen, dann werden automatisch die als „hervorgehoben“ markierten Produkte genommen — auch dort zählen nur die ersten drei.' },
            },
          ],
        },
        {
          label: 'Videos',
          fields: [
            {
              name: 'videoSection',
              type: 'group',
              label: 'Video-Bereich',
              admin: { description: 'Bis zu drei YouTube-Videos auf der Startseite.' },
              fields: [
                { name: 'enabled', type: 'checkbox', label: 'Video-Bereich anzeigen', defaultValue: true },
                { name: 'eyebrow', type: 'text', label: 'Überzeile', defaultValue: 'Bulltron Race TV' },
                { name: 'headline', type: 'text', label: 'Überschrift', defaultValue: 'Sieh die Technik in Aktion' },
                { name: 'subline', type: 'textarea', label: 'Einleitungstext' },
                {
                  name: 'videos',
                  type: 'array',
                  label: 'YouTube-Videos',
                  maxRows: 3,
                  fields: [
                    {
                      name: 'url',
                      type: 'text',
                      label: 'YouTube-Link oder Video-ID',
                      required: true,
                      admin: { description: 'https://youtu.be/ID, https://www.youtube.com/watch?v=ID oder nur die ID.' },
                    },
                    { name: 'title', type: 'text', label: 'Titel' },
                    { name: 'description', type: 'textarea', label: 'Kurztext' },
                    {
                      name: 'previewImage',
                      type: 'upload',
                      relationTo: 'media',
                      label: 'Vorschaubild',
                      admin: { description: 'Wird vor dem Klick angezeigt. Ohne Bild erscheint eine neutrale Fläche mit Play-Button.' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Vorteile & Partner',
          fields: [
            { name: 'uspHeadline', type: 'text', label: 'Überschrift Vorteile', defaultValue: 'Warum Bulltron Race' },
            {
              name: 'usps',
              type: 'array',
              label: 'Vorteile',
              fields: [
                {
                  name: 'icon',
                  type: 'select',
                  label: 'Symbol',
                  defaultValue: 'bolt',
                  options: [
                    { label: 'Blitz', value: 'bolt' },
                    { label: 'Schild', value: 'shield' },
                    { label: 'Gewicht', value: 'weight' },
                    { label: 'Thermometer', value: 'temp' },
                    { label: 'LKW', value: 'truck' },
                    { label: 'Headset', value: 'support' },
                    { label: 'Fabrik', value: 'factory' },
                    { label: 'Kreislauf', value: 'cycle' },
                  ],
                },
                { name: 'title', type: 'text', label: 'Titel', required: true },
                { name: 'text', type: 'textarea', label: 'Text' },
              ],
            },
            { name: 'partnerHeadline', type: 'text', label: 'Überschrift Partner', defaultValue: 'Im Renneinsatz bewährt' },
            {
              name: 'partners',
              type: 'array',
              label: 'Partner',
              fields: [
                { name: 'name', type: 'text', label: 'Name', required: true },
                { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
                { name: 'url', type: 'text', label: 'Website' },
              ],
            },
            {
              name: 'ctaBand',
              type: 'group',
              label: 'Abschluss-Banner',
              fields: [
                { name: 'enabled', type: 'checkbox', label: 'Anzeigen', defaultValue: true },
                { name: 'headline', type: 'text', label: 'Überschrift' },
                { name: 'text', type: 'textarea', label: 'Text' },
                { name: 'ctaLabel', type: 'text', label: 'Button-Text' },
                { name: 'ctaUrl', type: 'text', label: 'Button-Ziel' },
              ],
            },
          ],
        },
        { label: 'SEO', fields: [seoField] },
      ],
    },
  ],
}
