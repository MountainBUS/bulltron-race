import fs from 'fs/promises'
import path from 'path'
import JSZip from 'jszip'
import type { PayloadRequest } from 'payload'

/**
 * Storno und die beiden Exporte, als Endpunkte an der Rechnungs-Collection.
 *
 * ANGEMELDET ODER GAR NICHT: Jeder Handler prüft `req.user`. Hier liegen Namen,
 * Anschriften und Beträge von Kunden; ein offener Endpunkt wäre ein Leck, auch
 * wenn die Adresse niemand errät.
 */

const abgelehnt = (): Response =>
  Response.json({ error: 'Nicht angemeldet.' }, { status: 403 })

/** Liest den Zeitraum aus der Adresse. Fehlt er, gilt das laufende Jahr. */
const zeitraum = (url: string): { von: string; bis: string } => {
  const p = new URL(url).searchParams
  const jahr = new Date().getFullYear()
  const von = p.get('von') || `${jahr}-01-01`
  const bis = p.get('bis') || `${jahr}-12-31`
  return { von, bis }
}

/**
 * Tagesgrenze in deutscher Zeit als ISO-Zeitpunkt.
 *
 * Der Container läuft in UTC. Mit `T00:00:00.000Z` als Untergrenze fehlte im
 * Januarexport jede Rechnung, die am 1. Januar vor 1 Uhr deutscher Zeit
 * entstanden ist — sie trägt dann noch ein Datum aus dem Dezember. Gesucht wird
 * deshalb nach deutschen Kalendertagen, nicht nach UTC-Tagen.
 *
 * Die Verschiebung wird gemessen statt angenommen (ein fest verdrahtetes
 * „plus eine Stunde" wäre im Sommer falsch): Der Tag wird als UTC gelesen,
 * danach wird geprüft, welche deutsche Ortszeit dabei herauskommt.
 */
const tagesbeginn = (tag: string): number => {
  const roh = new Date(`${tag}T00:00:00.000Z`)
  const teile = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(roh)
  const w = (art: string) => Number(teile.find((t) => t.type === art)?.value ?? 0)
  const alsUtc = Date.UTC(w('year'), w('month') - 1, w('day'), w('hour') % 24, w('minute'), w('second'))
  return roh.getTime() - (alsUtc - roh.getTime())
}

/**
 * Untergrenze ist Mitternacht deutscher Zeit, Obergrenze die letzte
 * Millisekunde des Tages — gerechnet als Beginn des Folgetages minus eins.
 * Mit „23:59:59.999" griffe die Obergrenze knapp eine Sekunde in den nächsten
 * Tag, weil die Zeitzonenverschiebung nur sekundengenau zu ermitteln ist.
 */
const grenze = (tag: string, ende: boolean): string => {
  if (!ende) return new Date(tagesbeginn(tag)).toISOString()
  const folgetag = new Date(`${tag}T00:00:00.000Z`)
  folgetag.setUTCDate(folgetag.getUTCDate() + 1)
  return new Date(tagesbeginn(folgetag.toISOString().slice(0, 10)) - 1).toISOString()
}

const SEITE = 500

const rechnungenImZeitraum = async (req: PayloadRequest, von: string, bis: string) => {
  /* Seitenweise holen statt mit einem festen Deckel: Vorher brach der Export
     bei 5000 Rechnungen stillschweigend ab, und niemand hätte es gemerkt. */
  const alle: Record<string, any>[] = []
  for (let seite = 1; ; seite += 1) {
    const treffer = await req.payload.find({
      collection: 'invoices',
      where: {
        and: [
          { invoiceDate: { greater_than_equal: grenze(von, false) } },
          { invoiceDate: { less_than_equal: grenze(bis, true) } },
        ],
      },
      sort: 'sequence',
      limit: SEITE,
      page: seite,
      depth: 0,
      overrideAccess: true,
    })
    alle.push(...(treffer.docs as Record<string, any>[]))
    if (!treffer.hasNextPage) break
  }
  return alle
}

/** Wo die PDFs liegen — dieselbe Regel wie in der Collection. */
const ablage = (): string =>
  process.env.INVOICE_DIR ||
  (process.env.MEDIA_DIR ? path.join(process.env.MEDIA_DIR, 'rechnungen') : 'private/rechnungen')

/* ----------------------------------------------------------------- Storno - */

export const stornoHandler = async (req: PayloadRequest): Promise<Response> => {
  if (!req.user) return abgelehnt()

  const id = (req.routeParams as Record<string, unknown> | undefined)?.id
  if (!id) return Response.json({ error: 'Keine Rechnung angegeben.' }, { status: 400 })

  let grund: string | null = null
  try {
    const koerper = typeof req.json === 'function' ? await req.json() : null
    if (koerper && typeof koerper.grund === 'string') grund = koerper.grund.trim() || null
  } catch {
    /* Ohne Begründung ist auch in Ordnung. */
  }

  try {
    const original = (await req.payload.findByID({
      collection: 'invoices',
      id: String(id),
      depth: 0,
      overrideAccess: true,
    })) as Record<string, any>

    const { rechnungStornieren } = await import('./rechnung-erzeugen')
    const { getSiteSettings } = await import('./payload')
    const einstellungen = await getSiteSettings()
    const storno = await rechnungStornieren(req.payload, original, einstellungen as Record<string, any>, grund)

    return Response.json({ ok: true, storno: storno.invoiceNumber, id: storno.id })
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : 'Unbekannter Fehler.'
    return Response.json({ error: text }, { status: 409 })
  }
}

/* -------------------------------------------------------------------- ZIP - */

export const zipHandler = async (req: PayloadRequest): Promise<Response> => {
  if (!req.user) return abgelehnt()
  const { von, bis } = zeitraum(req.url ?? 'http://x/')
  const rechnungen = await rechnungenImZeitraum(req, von, bis)

  const zip = new JSZip()
  const verzeichnis = ablage()
  const fehlend: string[] = []

  for (const rechnung of rechnungen) {
    if (!rechnung.filename) {
      fehlend.push(rechnung.invoiceNumber)
      continue
    }
    try {
      const inhalt = await fs.readFile(path.join(verzeichnis, rechnung.filename))
      zip.file(`${rechnung.invoiceNumber}.pdf`, inhalt)
    } catch {
      fehlend.push(rechnung.invoiceNumber)
    }
  }

  /* Fehlt eine Datei, wird das nicht verschwiegen: Eine Textdatei im Archiv
     nennt die betroffenen Nummern. Ein stillschweigend unvollständiger Export
     wäre für die Buchhaltung schlimmer als ein sichtbarer Hinweis. */
  if (fehlend.length > 0) {
    zip.file(
      'FEHLENDE-DATEIEN.txt',
      `Zu diesen Rechnungen wurde keine PDF-Datei gefunden:\n\n${fehlend.join('\n')}\n`,
    )
  }

  const inhalt = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return new Response(new Uint8Array(inhalt), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="rechnungen-${von}-bis-${bis}.zip"`,
    },
  })
}

/* -------------------------------------------------------------------- CSV - */

/** Zahl mit Komma, so wie deutsche Tabellenprogramme sie erwarten. */
const zahl = (wert: unknown): string =>
  typeof wert === 'number' ? wert.toFixed(2).replace('.', ',') : ''

/**
 * Ein Feld für die CSV.
 *
 * Maskiert Semikolon, Anführungszeichen und Zeilenumbrüche — einschließlich des
 * einzelnen Wagenrücklaufs, der die Zeile sonst mitten im Namen zerlegt.
 *
 * Und entschärft führende Rechenzeichen: Namen und Anschriften kommen vom
 * Kunden über Stripe. Ein Feld, das mit =, +, - oder @ beginnt, führt Excel und
 * LibreOffice als Formel aus, sobald der Steuerberater die Datei öffnet. Ein
 * vorangestelltes Apostroph verhindert das und ist in der Zelle nicht sichtbar.
 */
const feld = (wert: unknown): string => {
  let text = wert === null || wert === undefined ? '' : String(wert)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const tag = (wert: unknown): string => {
  if (!wert) return ''
  const d = new Date(String(wert))
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('de-DE').format(d)
}

export const csvHandler = async (req: PayloadRequest): Promise<Response> => {
  if (!req.user) return abgelehnt()
  const { von, bis } = zeitraum(req.url ?? 'http://x/')
  const rechnungen = await rechnungenImZeitraum(req, von, bis)

  const spalten = [
    'Rechnungsnummer',
    'Art',
    'Rechnungsdatum',
    'Leistungsdatum',
    'Bestellnummer',
    'Kunde',
    'PLZ',
    'Ort',
    'Land',
    'Netto',
    'Steuersatz',
    'Steuer',
    'Brutto',
    'Gutschein',
    'Zahlungsbeleg',
    'Storniert',
  ]

  const zeilen = rechnungen.map((r) =>
    [
      feld(r.invoiceNumber),
      feld(r.kind === 'cancellation' ? 'Storno' : 'Rechnung'),
      feld(tag(r.invoiceDate)),
      feld(tag(r.paidAt ?? r.invoiceDate)),
      feld(r.orderNumber),
      feld(r.customerName),
      feld(r.address?.postalCode),
      feld(r.address?.city),
      feld(r.address?.country),
      zahl(r.netTotal),
      zahl(r.taxRate),
      zahl(r.taxTotal),
      zahl(r.grossTotal),
      feld(r.couponCode),
      feld(r.paymentReference),
      feld(r.cancelled ? 'ja' : ''),
    ].join(';'),
  )

  /* Byte Order Mark voran: Ohne sie zeigt Excel unter Windows aus „Müller"
     ein „MÃ¼ller". */
  const csv = '﻿' + [spalten.join(';'), ...zeilen].join('\r\n') + '\r\n'

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rechnungen-${von}-bis-${bis}.csv"`,
    },
  })
}
