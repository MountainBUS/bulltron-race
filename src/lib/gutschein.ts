/**
 * Prüfung und Berechnung von Gutscheincodes.
 *
 * AN EINER STELLE, mit Absicht: Dieselbe Funktion beantwortet die Eingabe im
 * Warenkorb, rechnet beim Anlegen der Stripe-Sitzung erneut und wird vom
 * Webhook für die Bestellung herangezogen. Läge die Logik zweimal im Code,
 * würde sie früher oder später auseinanderlaufen — und der Kunde sähe im
 * Warenkorb einen anderen Betrag als auf der Bezahlseite.
 *
 * GERECHNET WIRD IN CENT, nicht in Euro. 0,1 + 0,2 ergibt in Fließkomma nicht
 * 0,3; bei Prozentrabatten auf krumme Summen fällt das sonst irgendwann als
 * Cent-Differenz zur Stripe-Rechnung auf.
 *
 * DER BROWSER RECHNET NICHTS. Der Warenkorb zeigt an, was diese Funktion auf
 * dem Server ergeben hat, und vor dem Bezahlen läuft sie noch einmal mit den
 * Preisen aus der Datenbank. Ein im Browser veränderter Betrag kommt nirgends
 * an.
 */

export type GutscheinArt = 'percent' | 'amount' | 'shipping'

/** Ein Warenkorbposten, so wie ihn der Server aus der Datenbank kennt. */
export type GutscheinArtikel = {
  id: string | number
  preisCent: number
  menge: number
  kategorieIds: (string | number)[]
}

/** Der Gutschein, wie er in der Collection steht. */
export type GutscheinDaten = {
  code: string
  active?: boolean | null
  kind?: GutscheinArt | null
  percent?: number | null
  amount?: number | null
  validFrom?: string | null
  validUntil?: string | null
  minOrderValue?: number | null
  maxRedemptions?: number | null
  redemptions?: number | null
  products?: unknown
  categories?: unknown
}

export type GutscheinAbgelehnt = { ok: false; grund: string }

export type GutscheinAngenommen = {
  ok: true
  code: string
  art: GutscheinArt
  /** Abzug auf den Warenwert, in Cent. Bei „versandkostenfrei" null. */
  rabattCent: number
  versandfrei: boolean
  /** Kurzer Text für die Rabattzeile im Warenkorb. */
  beschriftung: string
}

export type GutscheinErgebnis = GutscheinAbgelehnt | GutscheinAngenommen

/**
 * Typwächter statt `if (ergebnis.ok)`.
 *
 * Im Projekt steht `strict` in der tsconfig auf `false`, und ohne
 * `strictNullChecks` verengt TypeScript eine Vereinigung nicht zuverlässig über
 * ein Feld mit festem Wahrheitswert. Ein benannter Wächter tut es auch dann,
 * und zwar in beide Richtungen: Im Sonst-Zweig steht sicher die Ablehnung.
 */
export const gutscheinGilt = (ergebnis: GutscheinErgebnis): ergebnis is GutscheinAngenommen => ergebnis.ok === true

/** Vereinheitlicht die Eingabe: ohne Leerzeichen, in Großbuchstaben. */
export const codeNormalisieren = (wert: unknown): string =>
  typeof wert === 'string' ? wert.replace(/\s+/g, '').toUpperCase() : ''

/** Eine Beziehung kann je nach `depth` als ID oder als Objekt vorliegen. */
const idsAus = (wert: unknown): string[] => {
  if (!Array.isArray(wert)) return []
  return wert
    .map((eintrag) => (typeof eintrag === 'object' && eintrag !== null ? (eintrag as { id?: unknown }).id : eintrag))
    .filter((id): id is string | number => id !== null && id !== undefined)
    .map(String)
}

/**
 * Der Tag, auf den es ankommt, als „JJJJ-MM-TT".
 *
 * Der Server läuft in UTC, der Shop verkauft nach Deutschland. Ein Code, der
 * „bis 31.12." gilt, soll um 23 Uhr deutscher Zeit am 31.12. noch gelten und
 * nicht schon seit einer Stunde abgelaufen sein. Deshalb wird der heutige Tag
 * in Europe/Berlin bestimmt und mit dem gespeicherten Datum als Zeichenkette
 * verglichen — das umgeht die Zeitzonenfallen vollständig.
 */
const tagInBerlin = (zeitpunkt: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', dateStyle: 'short' }).format(zeitpunkt)

/** Payload speichert ein reines Datum als Mitternacht UTC. */
const tagAus = (wert?: string | null): string | null => {
  if (!wert) return null
  const datum = new Date(wert)
  return Number.isNaN(datum.getTime()) ? null : datum.toISOString().slice(0, 10)
}

const euroText = (cent: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cent / 100)

/**
 * Prüft einen Gutschein gegen einen Warenkorb und berechnet den Abzug.
 *
 * Die Begründungen sind bewusst für den Kunden geschrieben und nennen nicht,
 * woran genau es lag, wenn das niemanden etwas angeht: Dass ein Code existiert,
 * aber abgelaufen ist, ist eine brauchbare Auskunft; dass er für ein bestimmtes
 * anderes Produkt gedacht war, nicht.
 */
export const gutscheinPruefen = (
  gutschein: GutscheinDaten,
  artikel: GutscheinArtikel[],
  jetzt: Date = new Date(),
): GutscheinErgebnis => {
  const code = codeNormalisieren(gutschein.code)

  if (gutschein.active === false) {
    return { ok: false, grund: 'Dieser Code ist nicht gültig.' }
  }

  const heute = tagInBerlin(jetzt)
  const ab = tagAus(gutschein.validFrom)
  const bis = tagAus(gutschein.validUntil)
  if (ab && heute < ab) {
    return { ok: false, grund: 'Dieser Code gilt noch nicht.' }
  }
  if (bis && heute > bis) {
    return { ok: false, grund: 'Dieser Code ist abgelaufen.' }
  }

  const grenze = gutschein.maxRedemptions ?? 0
  if (grenze > 0 && (gutschein.redemptions ?? 0) >= grenze) {
    return { ok: false, grund: 'Dieser Code wurde bereits vollständig eingelöst.' }
  }

  /* Welche Posten zählen? Ohne Einschränkung alle; sonst die, die in der
     Produktliste stehen oder in einer der genannten Kategorien. */
  const nurProdukte = idsAus(gutschein.products)
  const nurKategorien = idsAus(gutschein.categories)
  const eingeschraenkt = nurProdukte.length > 0 || nurKategorien.length > 0

  const passend = eingeschraenkt
    ? artikel.filter(
        (posten) =>
          nurProdukte.includes(String(posten.id)) ||
          posten.kategorieIds.some((id) => nurKategorien.includes(String(id))),
      )
    : artikel

  if (passend.length === 0) {
    return { ok: false, grund: 'Dieser Code gilt für keinen der Artikel in deinem Warenkorb.' }
  }

  const grundlageCent = passend.reduce((summe, posten) => summe + posten.preisCent * posten.menge, 0)

  const mindestCent = Math.round((gutschein.minOrderValue ?? 0) * 100)
  if (mindestCent > 0 && grundlageCent < mindestCent) {
    return {
      ok: false,
      grund: eingeschraenkt
        ? `Für diesen Code werden mindestens ${euroText(mindestCent)} an passenden Artikeln benötigt.`
        : `Dieser Code gilt ab einem Bestellwert von ${euroText(mindestCent)}.`,
    }
  }

  const art: GutscheinArt = gutschein.kind ?? 'percent'

  if (art === 'shipping') {
    return { ok: true, code, art, rabattCent: 0, versandfrei: true, beschriftung: 'Versandkostenfrei' }
  }

  if (art === 'percent') {
    const prozent = gutschein.percent ?? 0
    if (prozent <= 0) {
      return { ok: false, grund: 'Dieser Code ist nicht gültig.' }
    }
    /* Kaufmännisch runden, und zwar erst am Ende auf die Gesamtsumme — nicht je
       Posten, sonst summieren sich die Rundungen sichtbar auf. */
    const rabattCent = Math.min(Math.round((grundlageCent * prozent) / 100), grundlageCent)
    return { ok: true, code, art, rabattCent, versandfrei: false, beschriftung: `${prozent} % Rabatt` }
  }

  const betragCent = Math.round((gutschein.amount ?? 0) * 100)
  if (betragCent <= 0) {
    return { ok: false, grund: 'Dieser Code ist nicht gültig.' }
  }
  /* Nie mehr abziehen als der passende Warenwert hergibt: Ein 50-Euro-Code auf
     einen 30-Euro-Warenkorb zieht 30 Euro ab, nicht 50. Geld zurück gibt es
     über einen Gutschein nicht. */
  const rabattCent = Math.min(betragCent, grundlageCent)
  return { ok: true, code, art, rabattCent, versandfrei: false, beschriftung: `${euroText(betragCent)} Rabatt` }
}
