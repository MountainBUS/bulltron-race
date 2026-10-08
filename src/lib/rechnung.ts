import type { Payload } from 'payload'
import { toCents } from './format'

/**
 * Nummernkreis und Beträge für die Rechnungen.
 *
 * NUMMERNKREIS: BR-JJJJ-NNNN, mindestens vierstellig, je Kalenderjahr bei 1
 * beginnend. „BR" steht für Bulltron Race, so von Marco am 08.10.2026
 * vorgegeben.
 *
 * LÜCKENLOS, UND ZWAR ERZWUNGEN: Auf `invoiceNumber` liegt ein eindeutiger
 * Index. Zwei gleichzeitige Bestellungen könnten dieselbe freie Nummer
 * ermitteln — die zweite läuft dann in den Index und wird hier mit der nächsten
 * Nummer wiederholt. Ein „lies den Höchststand, addiere eins" ohne diesen Index
 * würde die Dublette still durchlassen, und eine doppelte Rechnungsnummer ist
 * schlimmer als eine fehlende.
 *
 * GERECHNET WIRD IN CENT. Die Preise im Shop sind Bruttopreise; Netto und
 * Steuer werden aus dem Bruttobetrag herausgerechnet, nicht umgekehrt. Nur so
 * stimmt der Rechnungsbetrag auf den Cent mit dem überein, was Stripe
 * tatsächlich abgebucht hat.
 */

export const NUMMERNKREIS = 'BR'
export const STELLEN = 4

export type RechnungsBetraege = {
  itemsGross: number
  discountGross: number
  shippingGross: number
  grossTotal: number
  netTotal: number
  taxTotal: number
  taxRate: number
}

/** Formt Jahr und laufende Nummer zur Rechnungsnummer. */
export const rechnungsnummer = (jahr: number, nummer: number): string =>
  `${NUMMERNKREIS}-${jahr}-${String(nummer).padStart(STELLEN, '0')}`

/**
 * Rechnet die Beträge einer Rechnung aus den Bruttowerten der Bestellung.
 *
 * Alle Eingaben in Euro, alle Ausgaben in Euro — gerechnet wird dazwischen in
 * Cent. `vorzeichen` ist -1 für eine Stornorechnung; dann stehen alle Beträge
 * negativ, und eine Summe über Rechnung und Storno ergibt null.
 */
export const betraegeRechnen = (
  { itemsGross, discountGross, shippingGross }: { itemsGross: number; discountGross: number; shippingGross: number },
  steuersatz: number,
  vorzeichen: 1 | -1 = 1,
): RechnungsBetraege => {
  const waren = toCents(itemsGross)
  const rabatt = toCents(discountGross)
  const versand = toCents(shippingGross)
  const brutto = waren - rabatt + versand

  /* Herausrechnen: netto = brutto / (1 + satz/100), kaufmännisch gerundet.
     Die Steuer ist dann die Differenz — so kann sie sich nie um einen Cent von
     der Summe unterscheiden. */
  const netto = Math.round(brutto / (1 + steuersatz / 100))
  const steuer = brutto - netto

  const euro = (cent: number) => (cent * vorzeichen) / 100

  return {
    itemsGross: euro(waren),
    discountGross: euro(rabatt),
    shippingGross: euro(versand),
    grossTotal: euro(brutto),
    netTotal: euro(netto),
    taxTotal: euro(steuer),
    taxRate: steuersatz,
  }
}

/**
 * Die nächste freie laufende Nummer eines Jahres.
 *
 * Sortiert über das Zahlenfeld `sequence`, nicht über die Rechnungsnummer:
 * Als Text stünde „BR-2026-10000" vor „BR-2026-9999", und ab der
 * zehntausendsten Rechnung eines Jahres bekäme die nächste eine längst
 * vergebene Nummer.
 */
export const naechsteNummer = async (payload: Payload, jahr: number): Promise<number> => {
  const letzte = await payload.find({
    collection: 'invoices',
    where: { year: { equals: jahr } },
    sort: '-sequence',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const hoechste = (letzte.docs[0] as Record<string, any> | undefined)?.sequence
  return typeof hoechste === 'number' ? hoechste + 1 : 1
}

/**
 * Legt eine Rechnung an und wiederholt den Versuch, wenn die Nummer in der
 * Zwischenzeit vergeben wurde.
 *
 * `erzeugen` bekommt die zugeteilte Nummer und liefert die fertigen Daten samt
 * PDF — das PDF trägt die Nummer, muss also nach der Zuteilung entstehen und
 * bei einer Wiederholung neu gebaut werden.
 */
export const rechnungAnlegen = async (
  payload: Payload,
  jahr: number,
  erzeugen: (nummer: string, laufend: number) => Promise<{ daten: Record<string, unknown>; pdf: Buffer }>,
  versuche = 5,
): Promise<Record<string, any>> => {
  let letzterFehler: unknown = null

  for (let versuch = 0; versuch < versuche; versuch += 1) {
    const laufend = await naechsteNummer(payload, jahr)
    const nummer = rechnungsnummer(jahr, laufend)
    const { daten, pdf } = await erzeugen(nummer, laufend)

    try {
      return (await payload.create({
        collection: 'invoices',
        overrideAccess: true,
        data: { ...daten, invoiceNumber: nummer, year: jahr, sequence: laufend } as never,
        file: {
          data: pdf,
          mimetype: 'application/pdf',
          name: `${nummer}.pdf`,
          size: pdf.length,
        },
      })) as Record<string, any>
    } catch (fehler) {
      letzterFehler = fehler
      const text = fehler instanceof Error ? fehler.message : String(fehler)
      /* Nur bei einer Nummernkollision wiederholen. Jeder andere Fehler soll
         sofort nach oben, sonst verschleiern fünf Versuche die eigentliche
         Ursache. */
      if (!/unique|UNIQUE|duplicate|bereits/i.test(text)) throw fehler
      payload.logger.warn(`Rechnungsnummer ${nummer} war schon vergeben — neuer Versuch.`)
    }
  }

  throw letzterFehler instanceof Error
    ? letzterFehler
    : new Error('Rechnungsnummer konnte nach mehreren Versuchen nicht vergeben werden.')
}
