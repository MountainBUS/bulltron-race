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
  product?: number | string | Record<string, any> | null
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
  grund: '#0d1113',
  karte: '#151b1f',
  panel: '#1b2226',
  rot: '#e03e51',
  text: '#d7dee2',
  hell: '#ffffff',
  gedaempft: '#7d888e',
  linie: '#242c31',
  kante: '#2a3338',
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
 * Logo für die Mail.
 *
 * `logo-mail.png` ist freigestellt — es hat keinen eigenen Hintergrund, sondern
 * einen durchsichtigen. Das ist hier wichtiger als es klingt: Die erste Fassung
 * legte das Logo auf eine feste dunkle Fläche, und weil Outlook im Dunkelmodus
 * die Hintergrundfarben der Mail nachträglich aufhellt, die Farben in einem
 * Bild aber unangetastet lässt, stand das Logo danach in einem schwarzen
 * Kasten auf grauem Grund. Mit Transparenz kann das nicht mehr passieren,
 * egal was der Client mit dem Untergrund macht.
 *
 * Deshalb auch kein `flatten` und PNG statt JPEG — JPEG kennt keine
 * Transparenz. `logo.png` bleibt als Rückfallebene: es ist die Fassung mit
 * fester Fläche und wird nur genommen, wenn die freigestellte Datei fehlt.
 */
export const logoAnhang = async (): Promise<Anhang | null> => {
  const verzeichnis = path.join(process.cwd(), 'public', 'admin')

  try {
    const roh = await fs.readFile(path.join(verzeichnis, 'logo-mail.png'))
    const content = await sharp(roh).resize(520, undefined, { fit: 'inside' }).png().toBuffer()
    return { filename: 'logo.png', content, cid: 'bt-logo', contentType: 'image/png' }
  } catch {
    // Rückfallebene
  }

  try {
    const roh = await fs.readFile(path.join(verzeichnis, 'logo.png'))
    const content = await sharp(roh)
      .resize(480, undefined, { fit: 'inside' })
      .flatten({ background: FARBE.karte })
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
        /* Payload liefert Verknüpfungen in der Vorgabetiefe bereits aufgelöst:
           `product` ist hier ein vollständiger Datensatz, kein Schlüssel — und
           `mainImage` darin ebenfalls. Genau das ist der Grund, warum in der
           ersten Fassung keine Produktbilder in der Mail standen: sie reichte
           das Objekt an findByID weiter, was scheiterte und still zu „kein
           Bild" führte. Beide Formen werden deshalb behandelt. */
        const produkt = (typeof position.product === 'object'
          ? position.product
          : ((await payload.findByID({
              collection: 'products',
              id: position.product as never,
              depth: 1,
              overrideAccess: true,
            })) as Record<string, any>)) as Record<string, any>

        const bild =
          produkt?.mainImage && typeof produkt.mainImage === 'object'
            ? produkt.mainImage
            : produkt?.mainImage
              ? ((await payload.findByID({
                  collection: 'media',
                  id: produkt.mainImage as never,
                  overrideAccess: true,
                })) as Record<string, any>)
              : null
        if (!bild || typeof bild !== 'object') {
          payload.logger.warn(`Position ${index + 1} (${position.title ?? '?'}): kein Produktbild hinterlegt.`)
          return null
        }

        // Die kleinste erzeugte Größe reicht für 88 Bildpunkte Anzeige.
        const dateiname = bild.sizes?.thumbnail?.filename ?? bild.filename
        if (!dateiname) return null

        const anhang = await bildAnhang(path.join(verzeichnis, String(dateiname)), `pos-${index}`, 176, 176, 'contain')
        if (!anhang) {
          payload.logger.warn(`Position ${index + 1}: Bilddatei ${dateiname} nicht lesbar unter ${verzeichnis}.`)
        }
        return anhang
      } catch (error) {
        const meldung = error instanceof Error ? error.message : 'unbekannt'
        payload.logger.warn(`Position ${index + 1}: Produktbild konnte nicht aufbereitet werden (${meldung}).`)
        return null
      }
    }),
  )
}

/* -------------------------------------------------------------------- HTML */

/* Die Mail ist bewusst dunkel gehalten. Zwei Gründe: Sie trifft damit die
   Marke, und sie ist gegen die Eingriffe der Mailclients unempfindlich.
   Outlook und Apple Mail rechnen im Dunkelmodus helle Entwürfe selbsttätig um —
   aus der weißen Fläche wird Grau, aus dem schwarzen Kopf ein helles Grau, und
   das Ergebnis sieht aus wie ein Fehler. Ein von vornherein dunkler Entwurf
   bleibt in beiden Betriebsarten so, wie er gemeint ist. Dazu die beiden
   color-scheme-Angaben im Kopf, mit denen der Client erfährt, dass die
   Gestaltung beide Fälle abdeckt und er nichts umrechnen muss.

   Farben stehen als feste Werte im style-Attribut, dazu bgcolor an Tabellen
   und Zellen: Outlook unter Windows rendert mit der Word-Engine und ignoriert
   Hintergrundfarben aus CSS an manchen Stellen. */

const kopfbereich = (logo: Anhang | null, ueberschrift: string, unterzeile: string): string => `
<tr>
  <td bgcolor="${FARBE.karte}" style="background-color:${FARBE.karte};padding:40px 32px 30px 32px;text-align:center">
    ${
      logo
        ? `<img src="cid:${logo.cid}" width="230" alt="BULLTRON RACE" style="display:block;margin:0 auto 26px auto;width:230px;max-width:72%;height:auto;border:0" />`
        : `<div style="font-family:${SCHRIFT};font-size:22px;font-weight:bold;letter-spacing:4px;color:${FARBE.weiss};margin-bottom:26px">BULLTRON RACE</div>`
    }
    <div style="font-family:${SCHRIFT};font-size:11px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;color:${FARBE.rot}">${sicher(unterzeile)}</div>
    <div style="font-family:${SCHRIFT};font-size:27px;line-height:34px;font-weight:bold;color:${FARBE.hell};margin-top:10px">${sicher(ueberschrift)}</div>
  </td>
</tr>
<tr>
  <td bgcolor="${FARBE.rot}" style="background-color:${FARBE.rot};font-size:0;line-height:0;height:3px">&nbsp;</td>
</tr>`

const absatz = (inhalt: string, oben = 0): string =>
  `<p style="font-family:${SCHRIFT};font-size:15px;line-height:25px;color:${FARBE.text};margin:${oben}px 0 0 0">${inhalt}</p>`

const abschnittsTitel = (text: string): string =>
  `<div style="font-family:${SCHRIFT};font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${FARBE.gedaempft};margin:0 0 16px 0">${sicher(text)}</div>`

const positionsZeile = (position: Position, bild: Anhang | null, letzte: boolean): string => {
  const menge = position.quantity ?? 1
  const rand = letzte ? '' : `border-bottom:1px solid ${FARBE.linie};`
  return `
<tr>
  <td width="88" style="${rand}padding:18px 18px 18px 0;vertical-align:top">
    ${
      bild
        ? `<img src="cid:${bild.cid}" width="88" height="88" alt="" style="display:block;width:88px;height:88px;border:0;background-color:${FARBE.weiss}" />`
        : `<div style="width:88px;height:88px;background-color:${FARBE.panel}"></div>`
    }
  </td>
  <td style="${rand}padding:18px 12px 18px 0;vertical-align:top">
    <div style="font-family:${SCHRIFT};font-size:16px;font-weight:bold;line-height:22px;color:${FARBE.hell}">${sicher(position.title)}</div>
    ${position.sku ? `<div style="font-family:${SCHRIFT};font-size:12px;line-height:18px;color:${FARBE.gedaempft};margin-top:4px">Artikelnummer ${sicher(position.sku)}</div>` : ''}
    <div style="font-family:${SCHRIFT};font-size:13px;line-height:19px;color:${FARBE.gedaempft};margin-top:8px">Menge ${menge} &nbsp;·&nbsp; je ${formatPrice(position.unitPrice ?? 0)}</div>
  </td>
  <td style="${rand}padding:18px 0;vertical-align:top;text-align:right;white-space:nowrap">
    <div style="font-family:${SCHRIFT};font-size:16px;font-weight:bold;line-height:22px;color:${FARBE.hell}">${formatPrice(position.lineTotal ?? 0)}</div>
  </td>
</tr>`
}

const summenZeile = (bezeichnung: string, betrag: string, stark = false): string => `
<tr>
  <td style="font-family:${SCHRIFT};font-size:${stark ? '16' : '14'}px;line-height:${stark ? '26' : '22'}px;${stark ? 'font-weight:bold;' : ''}color:${stark ? FARBE.hell : FARBE.gedaempft};padding:${stark ? '14' : '5'}px 0 ${stark ? '0' : '5'}px 0;${stark ? `border-top:2px solid ${FARBE.kante};` : ''}">${sicher(bezeichnung)}</td>
  <td style="font-family:${SCHRIFT};font-size:${stark ? '21' : '14'}px;line-height:${stark ? '26' : '22'}px;font-weight:bold;color:${stark ? FARBE.rot : FARBE.text};padding:${stark ? '14' : '5'}px 0 ${stark ? '0' : '5'}px 0;text-align:right;white-space:nowrap;${stark ? `border-top:2px solid ${FARBE.kante};` : ''}">${sicher(betrag)}</td>
</tr>`

const panel = (titel: string, zeilen: string): string => `
<tr>
  <td style="padding:34px 32px 38px 32px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FARBE.panel}" style="background-color:${FARBE.panel}">
      <tr>
        <td style="padding:24px 26px">
          ${abschnittsTitel(titel)}
          <div style="font-family:${SCHRIFT};font-size:15px;line-height:24px;color:${FARBE.text}">${zeilen}</div>
        </td>
      </tr>
    </table>
  </td>
</tr>`

const fussbereich = (e: Einstellungen, rechtslinks: Array<{ text: string; url: string }>): string => `
<tr>
  <td bgcolor="${FARBE.grund}" style="background-color:${FARBE.grund};padding:30px 32px;border-top:1px solid ${FARBE.linie}">
    ${
      rechtslinks.length > 0
        ? `<div style="font-family:${SCHRIFT};font-size:13px;line-height:22px;margin:0 0 18px 0">${rechtslinks
            .map((l) => `<a href="${sicher(l.url)}" style="color:${FARBE.hell};text-decoration:underline">${sicher(l.text)}</a>`)
            .join(`<span style="color:${FARBE.gedaempft}"> &nbsp;·&nbsp; </span>`)}</div>`
        : ''
    }
    <div style="font-family:${SCHRIFT};font-size:12px;line-height:20px;color:${FARBE.gedaempft}">
      ${absenderZeilen(e).map(sicher).join('<br />')}
    </div>
  </td>
</tr>`

const rahmen = (titel: string, inhalt: string): string => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${sicher(titel)}</title>
<style>:root { color-scheme: light dark; supported-color-schemes: light dark; }</style>
</head>
<body bgcolor="${FARBE.grund}" style="margin:0;padding:0;background-color:${FARBE.grund}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FARBE.grund}" style="background-color:${FARBE.grund}">
  <tr>
    <td align="center" style="padding:30px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${FARBE.karte}" style="width:600px;max-width:100%;background-color:${FARBE.karte}">
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

  return rahmen(
    `Ihre Bestellung ${b.orderNumber ?? ''}`,
    `
  ${kopfbereich(logo, 'Ihre Bestellung ist eingegangen', b.orderNumber ? `Bestellung ${b.orderNumber}` : 'Bestellbestätigung')}

  <tr>
    <td style="padding:36px 32px 0 32px">
      ${absatz(`${b.customerName ? `Guten Tag ${sicher(b.customerName)},` : 'Guten Tag,'}`)}
      ${absatz('vielen Dank für Ihre Bestellung. Hiermit bestätigen wir deren Eingang. Der Kaufvertrag kommt zustande, sobald wir die Annahme der Bestellung erklären oder die Ware versenden.', 14)}
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 0 32px">
      ${abschnittsTitel('Ihre Artikel')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${positionen.map((p, i) => positionsZeile(p, bilder[i] ?? null, i === positionen.length - 1)).join('')}
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 32px 0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${summenZeile('Zwischensumme', formatPrice(b.subtotal ?? 0))}
        ${summenZeile('Versand', formatPrice(b.shipping ?? 0))}
        ${summenZeile('Gesamtbetrag', formatPrice(b.total ?? 0), true)}
      </table>
      ${e.priceNote ? `<div style="font-family:${SCHRIFT};font-size:12px;line-height:18px;color:${FARBE.gedaempft};margin-top:12px;text-align:right">${sicher(e.priceNote)}</div>` : ''}
    </td>
  </tr>

  ${panel('Lieferadresse', anschriftZeilen(b).map(sicher).join('<br />'))}

  ${fussbereich(e, rechtslinks)}`,
  )
}

export const shopHtml = (b: Bestellung, e: Einstellungen, logo: Anhang | null, bilder: Array<Anhang | null>): string => {
  const positionen = b.items ?? []
  const kunde = [
    ...anschriftZeilen(b).map(sicher),
    b.email ? sicher(b.email) : null,
    b.phone ? sicher(b.phone) : null,
  ]
    .filter(Boolean)
    .join('<br />')

  return rahmen(
    `Neue Bestellung ${b.orderNumber ?? ''}`,
    `
  ${kopfbereich(logo, formatPrice(b.total ?? 0), 'Neue Bestellung')}

  <tr>
    <td style="padding:32px 32px 0 32px">
      ${abschnittsTitel(b.orderNumber ? `Bestellung ${b.orderNumber}` : 'Bestellung')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${positionen.map((p, i) => positionsZeile(p, bilder[i] ?? null, i === positionen.length - 1)).join('')}
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 32px 0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${summenZeile('Zwischensumme', formatPrice(b.subtotal ?? 0))}
        ${summenZeile('Versand', formatPrice(b.shipping ?? 0))}
        ${summenZeile('Gesamtbetrag', formatPrice(b.total ?? 0), true)}
      </table>
    </td>
  </tr>

  ${panel('Kunde', kunde)}

  ${fussbereich(e, [])}`,
  )
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
