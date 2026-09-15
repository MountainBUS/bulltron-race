import type { Payload } from 'payload'
import { formatPrice } from './format'

/**
 * Bestellbestätigung an den Kunden und Benachrichtigung an den Shop.
 *
 * Warum das nicht optional ist: § 2 Abs. 3 der AGB sagt dem Kunden zu, dass der
 * Zugang seiner Bestellung unmittelbar per E-Mail bestätigt wird, und § 312i
 * Abs. 1 Nr. 3 BGB verlangt genau diese Bestätigung. Die Quittung, die Stripe
 * verschicken kann, ist eine Quittung des Zahlungsdienstleisters und ersetzt
 * sie nicht.
 *
 * Wichtig für die Formulierung: Die Mail bestätigt den **Eingang** der
 * Bestellung, nicht deren Annahme. Nach § 2 Abs. 3 der AGB kommt der Vertrag
 * erst mit der Annahmeerklärung oder dem Versand zustande. Eine Mail, die
 * „Ihre Bestellung wurde angenommen" schreibt, würde den eigenen AGB
 * widersprechen und den Vertrag früher schließen als vorgesehen.
 *
 * Der Versand darf den Webhook nie scheitern lassen. Meldet der Webhook einen
 * Fehler, stellt Stripe erneut zu — die Bestellung liegt dann aber schon in der
 * Datenbank. Ein Mailproblem würde so zu Wiederholungen ohne Nutzen führen.
 * Deshalb: alles in try/catch, Fehler werden protokolliert, nicht geworfen.
 */

type Position = { title?: string | null; sku?: string | null; quantity?: number | null; unitPrice?: number | null; lineTotal?: number | null }

type Bestellung = {
  orderNumber?: string | null
  email?: string | null
  customerName?: string | null
  phone?: string | null
  shippingAddress?: { line1?: string | null; line2?: string | null; postalCode?: string | null; city?: string | null; country?: string | null } | null
  items?: Position[] | null
  subtotal?: number | null
  shipping?: number | null
  total?: number | null
}

type Einstellungen = Record<string, any>

/** Ohne diese beiden Angaben ist kein Versand möglich. */
export const mailVersandBereit = (): boolean => Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM)

const laender: Record<string, string> = { DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz' }

const anschrift = (b: Bestellung): string[] =>
  [
    b.customerName,
    b.shippingAddress?.line1,
    b.shippingAddress?.line2,
    [b.shippingAddress?.postalCode, b.shippingAddress?.city].filter(Boolean).join(' '),
    b.shippingAddress?.country ? (laender[b.shippingAddress.country] ?? b.shippingAddress.country) : null,
  ].filter((zeile): zeile is string => Boolean(zeile && zeile.trim()))

const positionsZeilen = (b: Bestellung): string[] =>
  (b.items ?? []).map((p) => {
    const menge = p.quantity ?? 1
    const bezeichnung = [p.title, p.sku ? `(${p.sku})` : null].filter(Boolean).join(' ')
    return `${menge} x ${bezeichnung} — ${formatPrice(p.lineTotal ?? 0)}`
  })

const absenderblock = (e: Einstellungen): string[] =>
  [
    e.companyName,
    e.street,
    [e.postalCode, e.city].filter(Boolean).join(' '),
    e.phone ? `Telefon: ${e.phone}` : null,
    e.email ? `E-Mail: ${e.email}` : null,
  ].filter((zeile): zeile is string => Boolean(zeile && zeile.trim()))

const alsHtml = (zeilen: string[]): string =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#12171a">` +
  zeilen
    .map((zeile) => {
      if (zeile === '') return '<div style="height:10px"></div>'
      if (zeile.startsWith('## ')) return `<div style="font-weight:bold;margin-top:14px">${zeile.slice(3)}</div>`
      return `<div>${zeile.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`
    })
    .join('') +
  `</div>`

const kundenText = (b: Bestellung, e: Einstellungen, basis: string): string[] => {
  const anrede = b.customerName ? `Guten Tag ${b.customerName},` : 'Guten Tag,'
  const rechtliches = [
    e.termsUrl ? `AGB und Widerrufsbelehrung: ${basis}${e.termsUrl}` : null,
    e.privacyUrl ? `Datenschutzerklärung: ${basis}${e.privacyUrl}` : null,
    e.imprintUrl ? `Impressum: ${basis}${e.imprintUrl}` : null,
  ].filter((zeile): zeile is string => Boolean(zeile))

  return [
    anrede,
    '',
    'vielen Dank für Ihre Bestellung. Hiermit bestätigen wir deren Eingang.',
    'Der Kaufvertrag kommt zustande, sobald wir die Annahme der Bestellung',
    'erklären oder die Ware versenden.',
    '',
    `Bestellnummer: ${b.orderNumber ?? ''}`,
    '',
    '## Ihre Bestellung',
    ...positionsZeilen(b),
    '',
    `Zwischensumme: ${formatPrice(b.subtotal ?? 0)}`,
    `Versand: ${formatPrice(b.shipping ?? 0)}`,
    `Gesamtbetrag: ${formatPrice(b.total ?? 0)}`,
    e.priceNote ? String(e.priceNote) : '',
    '',
    '## Lieferadresse',
    ...anschrift(b),
    '',
    '## Rechtliche Hinweise',
    ...rechtliches,
    '',
    '## Ihr Ansprechpartner',
    ...absenderblock(e),
  ]
}

const shopText = (b: Bestellung, e: Einstellungen): string[] => [
  `Neue Bestellung ${b.orderNumber ?? ''} über ${formatPrice(b.total ?? 0)}.`,
  '',
  '## Positionen',
  ...positionsZeilen(b),
  '',
  `Zwischensumme: ${formatPrice(b.subtotal ?? 0)}`,
  `Versand: ${formatPrice(b.shipping ?? 0)}`,
  `Gesamtbetrag: ${formatPrice(b.total ?? 0)}`,
  '',
  '## Kunde',
  ...anschrift(b),
  b.email ? `E-Mail: ${b.email}` : '',
  b.phone ? `Telefon: ${b.phone}` : '',
]

/**
 * Verschickt beide Mails. Wirft nie — der Aufrufer ist der Stripe-Webhook.
 * Rückgabe nur zur Protokollierung.
 */
export const bestellungVersenden = async (
  payload: Payload,
  bestellung: Bestellung,
  einstellungen: Einstellungen,
): Promise<{ kunde: boolean; shop: boolean }> => {
  const ergebnis = { kunde: false, shop: false }

  if (!mailVersandBereit()) {
    payload.logger.warn(
      `Bestellung ${bestellung.orderNumber}: kein SMTP-Zugang hinterlegt (SMTP_HOST/MAIL_FROM), es wurde keine Bestellbestätigung verschickt.`,
    )
    return ergebnis
  }

  const basis = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')
  const marke = einstellungen.siteName || 'BULLTRON RACE'

  if (bestellung.email) {
    try {
      const zeilen = kundenText(bestellung, einstellungen, basis)
      await payload.sendEmail({
        to: bestellung.email,
        subject: `Ihre Bestellung ${bestellung.orderNumber ?? ''} bei ${marke}`,
        text: zeilen.join('\n'),
        html: alsHtml(zeilen),
      })
      ergebnis.kunde = true
    } catch (error) {
      const meldung = error instanceof Error ? error.message : 'unbekannt'
      payload.logger.error(`Bestellbestätigung an ${bestellung.email} fehlgeschlagen: ${meldung}`)
    }
  } else {
    payload.logger.warn(`Bestellung ${bestellung.orderNumber}: keine E-Mail-Adresse, keine Bestätigung möglich.`)
  }

  const shopAdresse = process.env.MAIL_SHOP || einstellungen.email
  if (shopAdresse) {
    try {
      const zeilen = shopText(bestellung, einstellungen)
      await payload.sendEmail({
        to: shopAdresse,
        subject: `Neue Bestellung ${bestellung.orderNumber ?? ''} über ${formatPrice(bestellung.total ?? 0)}`,
        text: zeilen.join('\n'),
        html: alsHtml(zeilen),
      })
      ergebnis.shop = true
    } catch (error) {
      const meldung = error instanceof Error ? error.message : 'unbekannt'
      payload.logger.error(`Benachrichtigung an ${shopAdresse} fehlgeschlagen: ${meldung}`)
    }
  }

  return ergebnis
}
