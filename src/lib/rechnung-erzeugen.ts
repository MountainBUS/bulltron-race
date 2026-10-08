import type { Payload } from 'payload'
import { betraegeRechnen, rechnungAnlegen } from './rechnung'
import { toCents } from './format'
import { rechnungPdf } from './rechnung-pdf'
import type { PdfAussteller, PdfEmpfaenger, PdfPosition } from './rechnung-pdf'

/**
 * Legt die Rechnung zu einer Bestellung an — oder deren Storno.
 *
 * Beides liegt hier zusammen, weil es dieselbe Rechnung ist, einmal mit
 * umgekehrtem Vorzeichen. Zwei getrennte Funktionen würden früher oder später
 * auseinanderlaufen.
 *
 * DIE ANGABEN WERDEN ABGESCHRIEBEN, nicht verknüpft: Anschrift, Positionen und
 * Beträge stehen anschließend in der Rechnung selbst. Ändert jemand später die
 * Bestellung oder einen Produktnamen, bleibt die Rechnung so, wie der Kunde sie
 * bekommen hat.
 */

type Einstellungen = Record<string, any>

const ausstellerAus = (einstellungen: Einstellungen): PdfAussteller => ({
  companyName: einstellungen.companyName || 'ProVerDa GmbH',
  street: einstellungen.street || '',
  postalCode: einstellungen.postalCode || '',
  city: einstellungen.city || '',
  phone: einstellungen.phone,
  email: einstellungen.email,
  vatId: einstellungen.vatId,
  taxNumber: einstellungen.taxNumber,
  registerCourt: einstellungen.registerCourt,
  registerNumber: einstellungen.registerNumber,
  managingDirector: einstellungen.managingDirector,
  invoiceNote: einstellungen.invoiceNote,
})

/** Das Jahr, aus dem der Nummernkreis stammt — in deutscher Zeit gelesen. */
const jahrInBerlin = (zeitpunkt: Date): number =>
  Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric' }).format(zeitpunkt))

/**
 * Rechnung zu einer bezahlten Bestellung.
 *
 * Gibt den angelegten Datensatz und das PDF zurück — das PDF, damit der
 * Aufrufer es an die Bestellbestätigung hängen kann, ohne es von der Platte
 * zurücklesen zu müssen.
 */
export const rechnungZurBestellung = async (
  payload: Payload,
  bestellung: Record<string, any>,
  einstellungen: Einstellungen,
): Promise<{ rechnung: Record<string, any>; pdf: Buffer }> => {
  const jetzt = new Date()
  const steuersatz = Number(einstellungen.taxRate ?? 19)

  const positionen: PdfPosition[] = (bestellung.items ?? []).map((posten: Record<string, any>) => ({
    title: posten.title ?? 'Artikel',
    sku: posten.sku ?? null,
    quantity: Number(posten.quantity ?? 1),
    unitPrice: Number(posten.unitPrice ?? 0),
    lineTotal: Number(posten.lineTotal ?? 0),
  }))

  const betraege = betraegeRechnen(
    {
      itemsGross: Number(bestellung.subtotal ?? 0),
      discountGross: Number(bestellung.discount ?? 0),
      shippingGross: Number(bestellung.shipping ?? 0),
    },
    steuersatz,
  )

  /* GEGENPROBE gegen den tatsächlich abgebuchten Betrag. Die Rechnung wird aus
     Zwischensumme, Rabatt und Versand gerechnet; `total` ist das, was Stripe
     abgerechnet hat. Heute stimmen beide überein. Käme später eine zweite
     Versandart, eine automatische Steuerermittlung bei Stripe oder sonst eine
     Position dazu, liefen sie auseinander — und eine Rechnung über einen
     anderen Betrag als den eingezogenen wäre ein ernstes Problem. Lieber keine
     Rechnung und ein Eintrag im Protokoll als eine falsche. */
  const abgebucht = toCents(Number(bestellung.total ?? 0))
  if (abgebucht > 0 && toCents(betraege.grossTotal) !== abgebucht) {
    throw new Error(
      `Rechnungsbetrag (${betraege.grossTotal.toFixed(2)} EUR) weicht vom abgebuchten Betrag ` +
        `(${(abgebucht / 100).toFixed(2)} EUR) ab. Es wurde keine Rechnung erzeugt.`,
    )
  }

  /* Je Bestellung genau eine Rechnung. Der Webhook hat zwar eine eigene
     Dublettensperre, aber die Zusage „einmal erzeugt und abgelegt" soll hier
     stehen, wo die Rechnung entsteht — und nicht nur beim einzigen heutigen
     Aufrufer. */
  const schon = await payload.find({
    collection: 'invoices',
    where: { order: { equals: bestellung.id }, kind: { equals: 'invoice' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (schon.docs[0]) {
    const vorhanden = schon.docs[0] as Record<string, any>
    throw new Error(`Zu Bestellung ${bestellung.orderNumber ?? bestellung.id} gibt es bereits die Rechnung ${vorhanden.invoiceNumber}.`)
  }

  /* DIE RECHNUNGSANSCHRIFT, nicht die Lieferanschrift: Wer an eine Werkstatt
     oder als Geschenk liefern lässt, bekommt die Rechnung trotzdem auf den
     eigenen Namen — so verlangt es Paragraf 14 Absatz 4 Nummer 1 UStG. Stripe
     erhebt beide; fehlt die Rechnungsanschrift, bleibt die Lieferanschrift als
     Rückfallebene. */
  const anschrift = bestellung.billingAddress?.line1 ? bestellung.billingAddress : (bestellung.shippingAddress ?? {})
  const empfaenger: PdfEmpfaenger = {
    name: bestellung.customerName,
    line1: anschrift.line1,
    line2: anschrift.line2,
    postalCode: anschrift.postalCode,
    city: anschrift.city,
    country: anschrift.country,
  }

  let pdfPuffer: Buffer | null = null

  const rechnung = await rechnungAnlegen(payload, jahrInBerlin(jetzt), async (nummer) => {
    const pdf = await rechnungPdf(
      {
        storno: false,
        invoiceNumber: nummer,
        invoiceDate: jetzt,
        paidAt: jetzt,
        orderNumber: bestellung.orderNumber ?? null,
        items: positionen,
        couponCode: bestellung.couponCode ?? null,
        ...betraege,
      },
      ausstellerAus(einstellungen),
      empfaenger,
    )
    pdfPuffer = pdf
    return {
      pdf,
      daten: {
        kind: 'invoice',
        invoiceDate: jetzt.toISOString(),
        paidAt: jetzt.toISOString(),
        order: bestellung.id,
        orderNumber: bestellung.orderNumber ?? null,
        paymentReference: bestellung.stripe?.paymentIntentId ?? null,
        customerName: bestellung.customerName ?? null,
        email: bestellung.email ?? null,
        address: {
          line1: anschrift.line1 ?? null,
          line2: anschrift.line2 ?? null,
          postalCode: anschrift.postalCode ?? null,
          city: anschrift.city ?? null,
          country: anschrift.country ?? null,
        },
        items: positionen,
        couponCode: bestellung.couponCode ?? null,
        ...betraege,
      },
    }
  })

  return { rechnung, pdf: pdfPuffer as unknown as Buffer }
}

/**
 * Stornorechnung zu einer bestehenden Rechnung.
 *
 * Die ursprüngliche Rechnung bleibt unangetastet und wird nur als storniert
 * gekennzeichnet; gelöscht wird nichts. Eine bereits stornierte Rechnung lässt
 * sich kein zweites Mal stornieren.
 */
export const rechnungStornieren = async (
  payload: Payload,
  original: Record<string, any>,
  einstellungen: Einstellungen,
  grund?: string | null,
): Promise<Record<string, any>> => {
  if (original.kind === 'cancellation') {
    throw new Error('Eine Stornorechnung lässt sich nicht stornieren.')
  }
  if (original.cancelled) {
    throw new Error(`Rechnung ${original.invoiceNumber} ist bereits storniert.`)
  }

  /* Zweite Sicherung gegen ein doppeltes Storno: Das Kennzeichen am Original
     wird erst NACH dem Anlegen gesetzt, zwei gleichzeitige Klicks sähen es
     also beide noch nicht. Hier wird direkt nachgesehen, ob schon eine
     Stornorechnung auf dieses Original verweist. Ganz dicht ist auch das
     nicht — dafür bräuchte es eine Transaktion über beide Schritte —, aber es
     fängt den Fall ab, der im Betrieb tatsächlich vorkommt: zweimal geklickt,
     weil beim ersten Mal nichts zu passieren schien. */
  const schonStorniert = await payload.find({
    collection: 'invoices',
    where: { cancels: { equals: original.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (schonStorniert.docs[0]) {
    const vorhanden = schonStorniert.docs[0] as Record<string, any>
    throw new Error(`Zu Rechnung ${original.invoiceNumber} besteht bereits die Stornorechnung ${vorhanden.invoiceNumber}.`)
  }

  const jetzt = new Date()
  const steuersatz = Number(original.taxRate ?? einstellungen.taxRate ?? 19)

  const betraege = betraegeRechnen(
    {
      itemsGross: Number(original.itemsGross ?? 0),
      discountGross: Number(original.discountGross ?? 0),
      shippingGross: Number(original.shippingGross ?? 0),
    },
    steuersatz,
    -1,
  )

  const positionen: PdfPosition[] = (original.items ?? []).map((posten: Record<string, any>) => ({
    title: posten.title ?? 'Artikel',
    sku: posten.sku ?? null,
    quantity: -Number(posten.quantity ?? 1),
    unitPrice: Number(posten.unitPrice ?? 0),
    lineTotal: -Number(posten.lineTotal ?? 0),
  }))

  const anschrift = original.address ?? {}

  const storno = await rechnungAnlegen(payload, jahrInBerlin(jetzt), async (nummer) => {
    const pdf = await rechnungPdf(
      {
        storno: true,
        invoiceNumber: nummer,
        invoiceDate: jetzt,
        paidAt: original.paidAt ? new Date(original.paidAt) : jetzt,
        orderNumber: original.orderNumber ?? null,
        storniert: original.invoiceNumber,
        cancellationReason: grund ?? null,
        items: positionen,
        couponCode: original.couponCode ?? null,
        ...betraege,
      },
      ausstellerAus(einstellungen),
      {
        name: original.customerName,
        line1: anschrift.line1,
        line2: anschrift.line2,
        postalCode: anschrift.postalCode,
        city: anschrift.city,
        country: anschrift.country,
      },
    )
    return {
      pdf,
      daten: {
        kind: 'cancellation',
        invoiceDate: jetzt.toISOString(),
        paidAt: original.paidAt ?? null,
        order: typeof original.order === 'object' && original.order ? original.order.id : original.order,
        orderNumber: original.orderNumber ?? null,
        paymentReference: original.paymentReference ?? null,
        customerName: original.customerName ?? null,
        email: original.email ?? null,
        address: {
          line1: anschrift.line1 ?? null,
          line2: anschrift.line2 ?? null,
          postalCode: anschrift.postalCode ?? null,
          city: anschrift.city ?? null,
          country: anschrift.country ?? null,
        },
        items: positionen,
        couponCode: original.couponCode ?? null,
        cancels: original.id,
        cancellationReason: grund ?? null,
        ...betraege,
      },
    }
  })

  /* Erst jetzt das Original kennzeichnen: Scheitert das Anlegen des Storno,
     steht die Rechnung nicht fälschlich als storniert da. */
  await payload.update({
    collection: 'invoices',
    id: original.id,
    data: { cancelled: true, cancelledBy: storno.id, cancellationReason: grund ?? null } as never,
    overrideAccess: true,
  })

  return storno
}
