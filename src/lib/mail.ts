import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
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
 *
 * ## Warum Bilder als Anhang und nicht als Verweis
 *
 * Logo und Produktbilder hängen als Anhang mit Content-ID an der Mail, nicht
 * als `<img src="https://…">`. Zwei Gründe:
 *
 * 1. Die Dev-Instanz liegt hinter einem Passwortschutz. Ein Bild, das der
 *    Mailclient von dort laden müsste, bekäme eine 401 und bliebe leer — der
 *    Entwurf ließe sich also gar nicht beurteilen.
 * 2. Viele Mailclients laden entfernte Bilder erst nach Zustimmung. Angehängte
 *    Bilder zeigen sie sofort.
 *
 * Die Bilder werden vorher mit sharp auf Anzeigegröße gerechnet und nach JPEG
 * gewandelt. Die Uploads liegen als WebP vor, und Outlook für Windows stellt
 * WebP nicht dar.
 */

type Position = {
  product?: number | string | null
  title?: string | null
  sku?: string | null
  quantity?: number | null
  unitPrice?: number | null
  lineTotal?: number | null
}

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
type Anhang = { filename: string; content: Buffer; cid: string; contentType: string }

/** Ohne diese beiden Angaben ist kein Versand möglich. */
export const mailVersandBereit = (): boolean => Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM)

/* Farben aus dem Design-System. In E-Mails müssen sie als feste Werte im
   style-Attribut stehen — CSS-Variablen und <style>-Blöcke überleben den Weg
   durch die Mailclients nicht. */
const FARBE = {
  schwarz: '#12171a',
  rot: '#e03e51',
  text: '#1c2226',
  gedaempft: '#6b767d',
  linie: '#e3e6e8',
  flaeche: '#f4f5f6',
  weiss: '#ffffff',
}

const SCHRIFT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

const laender: Record<string, string> = { DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz' }

const sicher = (wert: unknown): string =>
  String(wert ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const anschriftZeilen = (b: Bestellung): string[] =>
  [
    b.customerName,
    b.shippingAddress?.line1,
    b.shippingAddress?.line2,
    [b.shippingAddress?.postalCode, b.shippingAddress?.city].filter(Boolean).join(' '),
    b.shippingAddress?.country ? (laender[b.shippingAddress.country] ?? b.shippingAddress.country) : null,
  ].filter((zeile): zeile is string => Boolean(zeile && zeile.trim()))

const absenderZeilen = (e: Einstellungen): string[] =>
  [
    e.companyName,
    e.street,
    [e.postalCode, e.city].filter(Boolean).join(' '),
    e.phone ? `Telefon: ${e.phone}` : null,
    e.email ? `E-Mail: ${e.email}` : null,
  ].filter((zeile): zeile is string => Boolean(zeile && zeile.trim()))

/* ------------------------------------------------------------------ Bilder */

/** Liest eine Datei und rechnet sie auf Anzeigegröße. Gibt bei jedem Problem null zurück. */
export const bildAnhang = async (
  dateipfad: string,
  cid: string,
  breite: number,
  hoehe: number,
  passend: 'contain' | 'cover',
): Promise<Anhang | null> => {
  try {
    const roh = await fs.readFile(dateipfad)
    const content = await sharp(roh)
      .resize(breite, hoehe, { fit: passend, background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, progressive: true })
      .toBuffer()
    return { filename: `${cid}.jpg`, content, cid, contentType: 'image/jpeg' }
  } catch {
    return null
  }
}

/**
 * Das Logo sitzt auf dunklem Grund und ist weiß gezeichnet — deshalb PNG mit
 * dunkler Fläche dahinter statt der JPEG-Behandlung der Produktbilder.
 */
export const logoAnhang = async (): Promise<Anhang | null> => {
  try {
    const roh = await fs.readFile(path.join(process.cwd(), 'public', 'admin', 'logo.png'))
    const content = await sharp(roh)
      .resize(480, undefined, { fit: 'inside' })
      .flatten({ background: FARBE.schwarz })
      .png()
      .toBuffer()
    return { filename: 'logo.png', content, cid: 'bt-logo', contentType: 'image/png' }
  } catch {
    return null
  }
}

/** Zu jeder Position das Produktbild, sofern eines hinterlegt ist. */
const positionsBilder = async (payload: Payload, positionen: Position[]): Promise<Array<Anhang | null>> => {
  const verzeichnis = process.env.MEDIA_DIR || path.join(process.cwd(), 'public', 'media')

  return Promise.all(
    positionen.map(async (position, index) => {
      if (!position.product) return null
      try {
        const produkt = (await payload.findByID({
          collection: 'products',
          id: position.product as never,
          depth: 1,
          overrideAccess: true,
        })) as Record<string, any>

        const bild = produkt?.mainImage
        if (!bild || typeof bild !== 'object') return null

        // Die kleinste erzeugte Größe reicht für 88 Bildpunkte Anzeige.
        const dateiname = bild.sizes?.thumbnail?.filename ?? bild.filename
        if (!dateiname) return null

        return await bildAnhang(path.join(verzeichnis, String(dateiname)), `pos-${index}`, 176, 176, 'contain')
      } catch {
        return null
      }
    }),
  )
}

/* -------------------------------------------------------------------- HTML */

const kopfbereich = (logo: Anhang | null, ueberschrift: string, unterzeile: string): string => `
<tr>
  <td style="background-color:${FARBE.schwarz};padding:34px 32px 30px 32px;text-align:center">
    ${
      logo
        ? `<img src="cid:${logo.cid}" width="220" alt="BULLTRON RACE" style="display:block;margin:0 auto 22px auto;width:220px;max-width:70%;height:auto;border:0" />`
        : `<div style="font-family:${SCHRIFT};font-size:20px;font-weight:bold;letter-spacing:3px;color:${FARBE.weiss};margin-bottom:22px">BULLTRON RACE</div>`
    }
    <div style="font-family:${SCHRIFT};font-size:11px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;color:${FARBE.rot}">${sicher(unterzeile)}</div>
    <div style="font-family:${SCHRIFT};font-size:26px;line-height:32px;font-weight:bold;color:${FARBE.weiss};margin-top:8px">${sicher(ueberschrift)}</div>
  </td>
</tr>`

const absatz = (inhalt: string, oben = 0): string =>
  `<p style="font-family:${SCHRIFT};font-size:15px;line-height:24px;color:${FARBE.text};margin:${oben}px 0 0 0">${inhalt}</p>`

const abschnittsTitel = (text: string): string =>
  `<div style="font-family:${SCHRIFT};font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${FARBE.gedaempft};margin:0 0 14px 0">${sicher(text)}</div>`

const positionsZeile = (position: Position, bild: Anhang | null, letzte: boolean): string => {
  const menge = position.quantity ?? 1
  const rand = letzte ? '' : `border-bottom:1px solid ${FARBE.linie};`
  return `
<tr>
  <td width="88" style="${rand}padding:16px 16px 16px 0;vertical-align:top">
    ${
      bild
        ? `<img src="cid:${bild.cid}" width="88" height="88" alt="" style="display:block;width:88px;height:88px;border:1px solid ${FARBE.linie};background-color:${FARBE.weiss}" />`
        : `<div style="width:88px;height:88px;border:1px solid ${FARBE.linie};background-color:${FARBE.flaeche}"></div>`
    }
  </td>
  <td style="${rand}padding:16px 12px 16px 0;vertical-align:top">
    <div style="font-family:${SCHRIFT};font-size:15px;font-weight:bold;line-height:21px;color:${FARBE.text}">${sicher(position.title)}</div>
    ${position.sku ? `<div style="font-family:${SCHRIFT};font-size:12px;line-height:18px;color:${FARBE.gedaempft};margin-top:3px">Artikelnummer ${sicher(position.sku)}</div>` : ''}
    <div style="font-family:${SCHRIFT};font-size:13px;line-height:19px;color:${FARBE.gedaempft};margin-top:6px">Menge ${menge} &nbsp;·&nbsp; je ${formatPrice(position.unitPrice ?? 0)}</div>
  </td>
  <td style="${rand}padding:16px 0;vertical-align:top;text-align:right;white-space:nowrap">
    <div style="font-family:${SCHRIFT};font-size:15px;font-weight:bold;line-height:21px;color:${FARBE.text}">${formatPrice(position.lineTotal ?? 0)}</div>
  </td>
</tr>`
}

const summenZeile = (bezeichnung: string, betrag: string, stark = false): string => `
<tr>
  <td style="font-family:${SCHRIFT};font-size:${stark ? '16' : '14'}px;line-height:${stark ? '24' : '22'}px;${stark ? 'font-weight:bold;' : ''}color:${stark ? FARBE.text : FARBE.gedaempft};padding:${stark ? '12' : '4'}px 0 ${stark ? '0' : '4'}px 0;${stark ? `border-top:2px solid ${FARBE.schwarz};` : ''}">${sicher(bezeichnung)}</td>
  <td style="font-family:${SCHRIFT};font-size:${stark ? '20' : '14'}px;line-height:${stark ? '24' : '22'}px;font-weight:bold;color:${stark ? FARBE.rot : FARBE.text};padding:${stark ? '12' : '4'}px 0 ${stark ? '0' : '4'}px 0;text-align:right;white-space:nowrap;${stark ? `border-top:2px solid ${FARBE.schwarz};` : ''}">${sicher(betrag)}</td>
</tr>`

const fussbereich = (e: Einstellungen, rechtslinks: Array<{ text: string; url: string }>): string => `
<tr>
  <td style="background-color:${FARBE.schwarz};padding:28px 32px">
    ${
      rechtslinks.length > 0
        ? `<div style="font-family:${SCHRIFT};font-size:13px;line-height:22px;margin:0 0 18px 0">${rechtslinks
            .map((l) => `<a href="${sicher(l.url)}" style="color:${FARBE.weiss};text-decoration:underline">${sicher(l.text)}</a>`)
            .join(`<span style="color:${FARBE.gedaempft}"> &nbsp;·&nbsp; </span>`)}</div>`
        : ''
    }
    <div style="font-family:${SCHRIFT};font-size:12px;line-height:20px;color:#9aa4aa">
      ${absenderZeilen(e).map(sicher).join('<br />')}
    </div>
  </td>
</tr>`

const rahmen = (inhalt: string): string => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>BULLTRON RACE</title>
</head>
<body style="margin:0;padding:0;background-color:${FARBE.flaeche}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${FARBE.flaeche}">
  <tr>
    <td align="center" style="padding:28px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${FARBE.weiss}">
        ${inhalt}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

export const kundenHtml = (
  b: Bestellung,
  e: Einstellungen,
  basis: string,
  logo: Anhang | null,
  bilder: Array<Anhang | null>,
): string => {
  const positionen = b.items ?? []
  const rechtslinks = [
    e.termsUrl ? { text: 'AGB und Widerruf', url: `${basis}${e.termsUrl}` } : null,
    e.privacyUrl ? { text: 'Datenschutz', url: `${basis}${e.privacyUrl}` } : null,
    e.imprintUrl ? { text: 'Impressum', url: `${basis}${e.imprintUrl}` } : null,
  ].filter((l): l is { text: string; url: string } => Boolean(l))

  return rahmen(`
  ${kopfbereich(logo, 'Ihre Bestellung ist eingegangen', b.orderNumber ? `Bestellung ${b.orderNumber}` : 'Bestellbestätigung')}

  <tr>
    <td style="padding:34px 32px 0 32px">
      ${absatz(`${b.customerName ? `Guten Tag ${sicher(b.customerName)},` : 'Guten Tag,'}`)}
      ${absatz('vielen Dank für Ihre Bestellung. Hiermit bestätigen wir deren Eingang. Der Kaufvertrag kommt zustande, sobald wir die Annahme der Bestellung erklären oder die Ware versenden.', 14)}
    </td>
  </tr>

  <tr>
    <td style="padding:30px 32px 0 32px">
      ${abschnittsTitel('Ihre Artikel')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${positionen.map((p, i) => positionsZeile(p, bilder[i] ?? null, i === positionen.length - 1)).join('')}
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:22px 32px 0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${summenZeile('Zwischensumme', formatPrice(b.subtotal ?? 0))}
        ${summenZeile('Versand', formatPrice(b.shipping ?? 0))}
        ${summenZeile('Gesamtbetrag', formatPrice(b.total ?? 0), true)}
      </table>
      ${e.priceNote ? `<div style="font-family:${SCHRIFT};font-size:12px;line-height:18px;color:${FARBE.gedaempft};margin-top:10px;text-align:right">${sicher(e.priceNote)}</div>` : ''}
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 36px 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${FARBE.flaeche}">
        <tr>
          <td style="padding:22px 24px">
            ${abschnittsTitel('Lieferadresse')}
            <div style="font-family:${SCHRIFT};font-size:15px;line-height:23px;color:${FARBE.text}">
              ${anschriftZeilen(b).map(sicher).join('<br />')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${fussbereich(e, rechtslinks)}`)
}

export const shopHtml = (b: Bestellung, e: Einstellungen, logo: Anhang | null, bilder: Array<Anhang | null>): string => {
  const positionen = b.items ?? []
  return rahmen(`
  ${kopfbereich(logo, `${formatPrice(b.total ?? 0)}`, 'Neue Bestellung')}

  <tr>
    <td style="padding:30px 32px 0 32px">
      ${abschnittsTitel(b.orderNumber ? `Bestellung ${b.orderNumber}` : 'Bestellung')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${positionen.map((p, i) => positionsZeile(p, bilder[i] ?? null, i === positionen.length - 1)).join('')}
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:22px 32px 0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${summenZeile('Zwischensumme', formatPrice(b.subtotal ?? 0))}
        ${summenZeile('Versand', formatPrice(b.shipping ?? 0))}
        ${summenZeile('Gesamtbetrag', formatPrice(b.total ?? 0), true)}
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 36px 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${FARBE.flaeche}">
        <tr>
          <td style="padding:22px 24px">
            ${abschnittsTitel('Kunde')}
            <div style="font-family:${SCHRIFT};font-size:15px;line-height:23px;color:${FARBE.text}">
              ${anschriftZeilen(b).map(sicher).join('<br />')}
              ${b.email ? `<br />${sicher(b.email)}` : ''}
              ${b.phone ? `<br />${sicher(b.phone)}` : ''}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${fussbereich(e, [])}`)
}

/* -------------------------------------------------------------------- Text */

const positionsText = (b: Bestellung): string[] =>
  (b.items ?? []).map((p) => {
    const menge = p.quantity ?? 1
    const bezeichnung = [p.title, p.sku ? `(${p.sku})` : null].filter(Boolean).join(' ')
    return `${menge} x ${bezeichnung} — ${formatPrice(p.lineTotal ?? 0)}`
  })

const kundenText = (b: Bestellung, e: Einstellungen, basis: string): string =>
  [
    b.customerName ? `Guten Tag ${b.customerName},` : 'Guten Tag,',
    '',
    'vielen Dank für Ihre Bestellung. Hiermit bestätigen wir deren Eingang.',
    'Der Kaufvertrag kommt zustande, sobald wir die Annahme der Bestellung',
    'erklären oder die Ware versenden.',
    '',
    `Bestellnummer: ${b.orderNumber ?? ''}`,
    '',
    'IHRE ARTIKEL',
    ...positionsText(b),
    '',
    `Zwischensumme: ${formatPrice(b.subtotal ?? 0)}`,
    `Versand: ${formatPrice(b.shipping ?? 0)}`,
    `Gesamtbetrag: ${formatPrice(b.total ?? 0)}`,
    e.priceNote ? String(e.priceNote) : '',
    '',
    'LIEFERADRESSE',
    ...anschriftZeilen(b),
    '',
    'RECHTLICHE HINWEISE',
    e.termsUrl ? `AGB und Widerruf: ${basis}${e.termsUrl}` : '',
    e.privacyUrl ? `Datenschutz: ${basis}${e.privacyUrl}` : '',
    e.imprintUrl ? `Impressum: ${basis}${e.imprintUrl}` : '',
    '',
    ...absenderZeilen(e),
  ]
    .filter((zeile, index, alle) => !(zeile === '' && alle[index - 1] === ''))
    .join('\n')

const shopText = (b: Bestellung): string =>
  [
    `Neue Bestellung ${b.orderNumber ?? ''} über ${formatPrice(b.total ?? 0)}.`,
    '',
    'POSITIONEN',
    ...positionsText(b),
    '',
    `Zwischensumme: ${formatPrice(b.subtotal ?? 0)}`,
    `Versand: ${formatPrice(b.shipping ?? 0)}`,
    `Gesamtbetrag: ${formatPrice(b.total ?? 0)}`,
    '',
    'KUNDE',
    ...anschriftZeilen(b),
    b.email ? `E-Mail: ${b.email}` : '',
    b.phone ? `Telefon: ${b.phone}` : '',
  ].join('\n')

/* ------------------------------------------------------------------ Versand */

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

  const logo = await logoAnhang()
  const bilder = await positionsBilder(payload, bestellung.items ?? [])
  const anhaenge = [logo, ...bilder].filter((a): a is Anhang => a !== null)

  if (!logo) {
    payload.logger.warn('Logo für die E-Mail nicht gefunden — die Mail geht mit Schriftzug statt Bild raus.')
  }

  if (bestellung.email) {
    try {
      await payload.sendEmail({
        to: bestellung.email,
        subject: `Ihre Bestellung ${bestellung.orderNumber ?? ''} bei ${marke}`,
        text: kundenText(bestellung, einstellungen, basis),
        html: kundenHtml(bestellung, einstellungen, basis, logo, bilder),
        attachments: anhaenge,
      } as never)
      ergebnis.kunde = true
      payload.logger.info(`Bestellbestätigung an ${bestellung.email} verschickt.`)
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
      await payload.sendEmail({
        to: shopAdresse,
        subject: `Neue Bestellung ${bestellung.orderNumber ?? ''} über ${formatPrice(bestellung.total ?? 0)}`,
        text: shopText(bestellung),
        html: shopHtml(bestellung, einstellungen, logo, bilder),
        attachments: anhaenge,
      } as never)
      ergebnis.shop = true
      payload.logger.info(`Benachrichtigung an ${shopAdresse} verschickt.`)
    } catch (error) {
      const meldung = error instanceof Error ? error.message : 'unbekannt'
      payload.logger.error(`Benachrichtigung an ${shopAdresse} fehlgeschlagen: ${meldung}`)
    }
  }

  return ergebnis
}
