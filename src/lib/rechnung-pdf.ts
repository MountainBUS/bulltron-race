import fs from 'fs/promises'
import path from 'path'
import PDFDocument from 'pdfkit'

/**
 * Erzeugt das Rechnungs-PDF.
 *
 * SCHRIFT: Die eingebauten Standardschriften von PDFKit, nicht die Hausschrift.
 * Barlow liegt im Projekt nur als woff und woff2 vor, und beides kann PDFKit
 * nicht einbetten. Helvetica deckt Umlaute, ß und das Euro-Zeichen ab; für ein
 * Dokument, das gelesen und abgeheftet wird, ist Lesbarkeit wichtiger als die
 * Hausschrift.
 *
 * KEINE BERECHNUNG HIER. Diese Datei setzt nur, was ihr übergeben wird. Was
 * gerechnet wird, steht in `src/lib/rechnung.ts` — sonst gäbe es zwei Stellen,
 * an denen sich eine Rundung ändern könnte.
 */

export type PdfPosition = {
  title: string
  sku?: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type PdfAussteller = {
  companyName: string
  street: string
  postalCode: string
  city: string
  phone?: string | null
  email?: string | null
  vatId?: string | null
  taxNumber?: string | null
  registerCourt?: string | null
  registerNumber?: string | null
  managingDirector?: string | null
  invoiceNote?: string | null
}

export type PdfEmpfaenger = {
  name?: string | null
  line1?: string | null
  line2?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
}

export type PdfRechnung = {
  storno: boolean
  invoiceNumber: string
  invoiceDate: Date
  paidAt?: Date | null
  orderNumber?: string | null
  /** Bei einer Stornorechnung: die Nummer der stornierten Rechnung. */
  storniert?: string | null
  cancellationReason?: string | null
  items: PdfPosition[]
  couponCode?: string | null
  discountGross: number
  shippingGross: number
  itemsGross: number
  netTotal: number
  taxRate: number
  taxTotal: number
  grossTotal: number
}

const geld = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/* Der Steuersatz soll als „19 %" erscheinen, nicht als „19,00 %". */
const satz = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const euro = (wert: number): string => `${geld.format(wert)} EUR`
/* Ausdrücklich deutsche Zeit: Der Container läuft in UTC. Eine Bestellung am
   1. Januar um 00:30 deutscher Zeit bekäme sonst eine Nummer aus dem neuen
   Jahr, auf dem Papier aber den 31. Dezember. */
const datum = (wert: Date): string =>
  new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(wert)

/**
 * Das Logo für den Kopf. Fehlt es, bleibt der Kopf eben ohne Bild.
 *
 * `logo-hell.png` ist die Fassung für hellen Grund — gemessene mittlere
 * Helligkeit der sichtbaren Pixel 61 gegenüber 202 bei `logo.png` und
 * `logo-mail.png`. Die beiden hellen Fassungen sind für den dunklen
 * Seiten- und Mailhintergrund gemacht; auf weißem Papier verschwindet der
 * Schriftzug „RACE" darin fast vollständig.
 */
const logoLesen = async (): Promise<Buffer | null> => {
  for (const name of ['logo-hell.png', 'logo.png']) {
    try {
      return await fs.readFile(path.join(process.cwd(), 'public', 'admin', name))
    } catch {
      /* nächster Versuch */
    }
  }
  return null
}

export const rechnungPdf = async (
  rechnung: PdfRechnung,
  aussteller: PdfAussteller,
  empfaenger: PdfEmpfaenger,
): Promise<Buffer> => {
  const logo = await logoLesen()

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 60, left: 55, right: 55 },
    /* Seiten werden gepuffert, damit der Fuß erst am Schluss auf JEDE Seite
       gesetzt werden kann — samt „Seite 1 von 3". Ohne Puffer wüsste die erste
       Seite nicht, wie viele noch folgen. */
    bufferPages: true,
    info: {
      Title: `${rechnung.storno ? 'Stornorechnung' : 'Rechnung'} ${rechnung.invoiceNumber}`,
      Author: aussteller.companyName,
      Subject: rechnung.orderNumber ? `Bestellung ${rechnung.orderNumber}` : undefined,
    },
  })

  const teile: Buffer[] = []
  doc.on('data', (stueck: Buffer) => teile.push(stueck))
  const fertig = new Promise<Buffer>((loesen) => doc.on('end', () => loesen(Buffer.concat(teile))))

  const links = doc.page.margins.left
  const rechts = doc.page.width - doc.page.margins.right
  const breite = rechts - links

  /* --- Kopf --------------------------------------------------------------- */
  if (logo) {
    try {
      doc.image(logo, links, 46, { fit: [150, 34] })
    } catch {
      /* Beschädigtes Bild soll keine Rechnung verhindern. */
    }
  }

  doc.font('Helvetica').fontSize(8).fillColor('#555555')
  doc.text(
    [aussteller.companyName, `${aussteller.street}`, `${aussteller.postalCode} ${aussteller.city}`]
      .filter(Boolean)
      .join('\n'),
    rechts - 200,
    46,
    { width: 200, align: 'right' },
  )

  /* --- Anschrift des Empfängers -------------------------------------------
     Der Kasten ist bewusst schmal: Rechts daneben stehen ab 309 Punkt die
     Eckdaten. Mit den vorher gesetzten 60 Prozent der Satzbreite reichte die
     Anschrift bis 346 Punkt und schob sich bei langen Firmennamen in die
     Rechnungsnummer. */
  const anschriftBreite = breite * 0.46

  doc.fontSize(7).fillColor('#777777')
  doc.text(
    `${aussteller.companyName} · ${aussteller.street} · ${aussteller.postalCode} ${aussteller.city}`,
    links,
    120,
    { width: anschriftBreite },
  )

  doc.font('Helvetica').fontSize(11).fillColor('#000000')
  doc.text(
    [
      empfaenger.name,
      empfaenger.line1,
      empfaenger.line2,
      [empfaenger.postalCode, empfaenger.city].filter(Boolean).join(' '),
      empfaenger.country && empfaenger.country.toUpperCase() !== 'DE' ? empfaenger.country : null,
    ]
      .filter(Boolean)
      .join('\n'),
    links,
    136,
    { width: anschriftBreite, lineGap: 2 },
  )

  /* --- Titel und Eckdaten ------------------------------------------------- */
  doc.font('Helvetica').fontSize(9).fillColor('#000000')
  const eckdaten: [string, string][] = [
    ['Rechnungsnummer', rechnung.invoiceNumber],
    ['Rechnungsdatum', datum(rechnung.invoiceDate)],
    ['Leistungsdatum', datum(rechnung.paidAt ?? rechnung.invoiceDate)],
  ]
  if (rechnung.orderNumber) eckdaten.push(['Bestellnummer', rechnung.orderNumber])
  if (rechnung.storno && rechnung.storniert) eckdaten.push(['Storniert wird', rechnung.storniert])

  let y = 136
  for (const [bezeichnung, wert] of eckdaten) {
    doc.font('Helvetica').fillColor('#555555').text(bezeichnung, rechts - 230, y, { width: 110 })
    doc.font('Helvetica-Bold').fillColor('#000000').text(wert, rechts - 115, y, { width: 115, align: 'right' })
    y += 14
  }

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000')
  doc.text(rechnung.storno ? 'Stornorechnung' : 'Rechnung', links, 240)

  if (rechnung.storno) {
    doc.font('Helvetica').fontSize(9).fillColor('#555555')
    doc.text(
      `Diese Stornorechnung hebt die Rechnung ${rechnung.storniert ?? ''} vollständig auf.${
        rechnung.cancellationReason ? ` Grund: ${rechnung.cancellationReason}` : ''
      }`,
      links,
      266,
      { width: breite },
    )
  }

  /* --- Positionen ---------------------------------------------------------
     Spalten und Umbruch. Der Fuß braucht am Seitenende Platz; `unterkante`
     ist die Linie, ab der nichts mehr gesetzt werden darf. Jeder Block —
     Position, Betragszeile, Schlusstext — fragt vorher `platz()`, nicht nur
     die Positionsschleife wie zuvor. Sonst schob sich der Betragsblock über
     die Fußzeile, sobald eine Rechnung mehr als etwa sechs Posten hatte. */
  const spalte = {
    menge: links,
    bezeichnung: links + 40,
    einzel: rechts - 190,
    summe: rechts - 95,
  }
  const breiteBezeichnung = spalte.einzel - spalte.bezeichnung - 12

  /* Höhe, die der Fuß am unteren Rand beansprucht. */
  const FUSS = 54
  const unterkante = () => doc.page.height - doc.page.margins.bottom - FUSS

  let zeile = rechnung.storno ? 300 : 282

  /** Zeichnet die Spaltenköpfe und gibt die Zeile darunter zurück. */
  const tabellenkopf = (oben: number): number => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
    doc.text('Menge', spalte.menge, oben)
    doc.text('Bezeichnung', spalte.bezeichnung, oben)
    doc.text('Einzelpreis', spalte.einzel, oben, { width: 85, align: 'right' })
    doc.text('Gesamt', spalte.summe, oben, { width: 95, align: 'right' })
    let naechste = oben + 14
    doc.moveTo(links, naechste).lineTo(rechts, naechste).lineWidth(0.7).strokeColor('#000000').stroke()
    return naechste + 10
  }

  /**
   * Sorgt dafür, dass `hoehe` Punkte noch auf die Seite passen.
   *
   * Reicht der Platz nicht, beginnt eine neue Seite. Die bekommt einen kurzen
   * Kopf mit der Rechnungsnummer — ein lose abgelegtes zweites Blatt wäre
   * sonst niemandem zuzuordnen, und Nummer wie Aussteller stünden nur auf
   * Blatt eins. Mit `mitTabellenkopf` werden auch die Spaltenüberschriften
   * wiederholt.
   */
  const platz = (hoehe: number, mitTabellenkopf = false) => {
    if (zeile + hoehe <= unterkante()) return
    doc.addPage()
    zeile = doc.page.margins.top
    doc.font('Helvetica').fontSize(8).fillColor('#777777')
    doc.text(
      `${rechnung.storno ? 'Stornorechnung' : 'Rechnung'} ${rechnung.invoiceNumber} · ${datum(rechnung.invoiceDate)}`,
      links,
      zeile,
      { width: breite },
    )
    zeile += 20
    if (mitTabellenkopf) zeile = tabellenkopf(zeile)
  }

  zeile = tabellenkopf(zeile)

  doc.font('Helvetica').fontSize(9.5)
  for (const posten of rechnung.items) {
    const bezeichnung = posten.sku ? `${posten.title}\nArt.-Nr. ${posten.sku}` : posten.title
    const hoehe = doc.heightOfString(bezeichnung, { width: breiteBezeichnung })
    platz(Math.max(hoehe, 12) + 8, true)

    doc.font('Helvetica').fontSize(9.5).fillColor('#000000')
    doc.text(String(posten.quantity), spalte.menge, zeile, { width: 36 })
    doc.text(bezeichnung, spalte.bezeichnung, zeile, { width: breiteBezeichnung })
    doc.text(euro(posten.unitPrice), spalte.einzel, zeile, { width: 85, align: 'right' })
    doc.text(euro(posten.lineTotal), spalte.summe, zeile, { width: 95, align: 'right' })
    zeile += Math.max(hoehe, 12) + 8
  }

  /* --- Beträge ------------------------------------------------------------
     Der ganze Block gehört zusammen; er wird am Stück umbrochen, damit die
     Gesamtsumme nicht allein auf der nächsten Seite steht. */
  const betragsZeilen = 2 + (rechnung.discountGross !== 0 ? 1 : 0)
  platz(betragsZeilen * 15 + 20 + 26 + 12, true)

  doc.moveTo(links, zeile).lineTo(rechts, zeile).lineWidth(0.5).strokeColor('#bbbbbb').stroke()
  zeile += 10

  const betrag = (bezeichnung: string, wert: string, fett = false) => {
    doc.font(fett ? 'Helvetica-Bold' : 'Helvetica').fontSize(fett ? 11 : 9.5).fillColor('#000000')
    doc.text(bezeichnung, spalte.einzel - 120, zeile, { width: 205, align: 'right' })
    doc.text(wert, spalte.summe, zeile, { width: 95, align: 'right' })
    zeile += fett ? 20 : 15
  }

  betrag('Zwischensumme', euro(rechnung.itemsGross))
  if (rechnung.discountGross !== 0) {
    /* Der Rabatt wird abgezogen, steht also mit umgekehrtem Vorzeichen in der
       Spalte. Auf der Stornorechnung sind alle Beträge negativ — dort gibt der
       Rabatt entsprechend etwas zurück und bekommt ein Plus. Ohne diese
       Umkehrung ginge die Spalte nicht auf. */
    const abzug = -rechnung.discountGross
    betrag(
      rechnung.couponCode ? `Rabatt (${rechnung.couponCode})` : 'Rabatt',
      abzug > 0 ? `+${euro(abzug)}` : euro(abzug),
    )
  }
  betrag('Versand', euro(rechnung.shippingGross))
  zeile += 2
  betrag('Gesamtbetrag', euro(rechnung.grossTotal), true)

  /* Die Steuerzeile bekommt die volle Satzbreite. Vorher war sie auf 315 Punkt
     begrenzt und brach bei negativen Beträgen — also auf jeder Stornorechnung
     — mitten im Nettobetrag um. */
  doc.font('Helvetica').fontSize(8.5).fillColor('#555555')
  doc.text(
    `darin enthalten ${satz.format(rechnung.taxRate)} % Umsatzsteuer: ${euro(rechnung.taxTotal)}  ·  Nettobetrag: ${euro(
      rechnung.netTotal,
    )}`,
    links,
    zeile,
    { width: breite, align: 'right' },
  )
  zeile += 26

  /* --- Schlusstext --------------------------------------------------------
     Nicht auf der Stornorechnung: Dort stünde sonst, der Betrag sei bezahlt
     und die Ware komme in zwei bis vier Werktagen. */
  if (aussteller.invoiceNote && !rechnung.storno) {
    const hoehe = doc.heightOfString(aussteller.invoiceNote, { width: breite })
    platz(hoehe + 6)
    doc.font('Helvetica').fontSize(9.5).fillColor('#000000')
    doc.text(aussteller.invoiceNote, links, zeile, { width: breite })
  }

  /* --- Fuß auf jede Seite -------------------------------------------------
     Erst jetzt, wo feststeht, wie viele Seiten es geworden sind. */
  const fussZeilen = [
    [aussteller.companyName, aussteller.street, `${aussteller.postalCode} ${aussteller.city}`]
      .filter(Boolean)
      .join(' · '),
    [
      aussteller.phone ? `Telefon ${aussteller.phone}` : null,
      aussteller.email ? aussteller.email : null,
      aussteller.managingDirector ? `Geschäftsführung: ${aussteller.managingDirector}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    [
      aussteller.vatId ? `USt-IdNr. ${aussteller.vatId}` : null,
      !aussteller.vatId && aussteller.taxNumber ? `Steuernummer ${aussteller.taxNumber}` : null,
      aussteller.registerCourt && aussteller.registerNumber
        ? `${aussteller.registerCourt}, ${aussteller.registerNumber}`
        : null,
    ]
      .filter(Boolean)
      .join(' · '),
  ].filter((z) => z.length > 0)

  const bereich = doc.bufferedPageRange()
  for (let seite = 0; seite < bereich.count; seite += 1) {
    doc.switchToPage(bereich.start + seite)
    const fussOben = doc.page.height - doc.page.margins.bottom - fussZeilen.length * 11 - 8
    doc.moveTo(links, fussOben - 10).lineTo(rechts, fussOben - 10).lineWidth(0.5).strokeColor('#dddddd').stroke()
    doc.font('Helvetica').fontSize(7.5).fillColor('#777777')
    doc.text(fussZeilen.join('\n'), links, fussOben, { width: breite, align: 'center', lineGap: 2 })
    if (bereich.count > 1) {
      doc.text(`Seite ${seite + 1} von ${bereich.count}`, links, fussOben - 24, { width: breite, align: 'right' })
    }
  }

  doc.end()
  return fertig
}
