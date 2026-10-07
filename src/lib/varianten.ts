import type { Product } from '../payload-types'

/**
 * Bauform-Varianten eines Produkts.
 *
 * Mehrere Batterien können elektrisch identisch sein und sich nur im Gehäuse
 * unterscheiden: die 55 Ah als L1 und L2, die 27 Ah als Metall, L1, L2 und L3.
 * Jede bleibt ein eigenes Produkt mit eigener Seite, eigener Artikelnummer und
 * eigenem Warenkorbeintrag — zusammengehalten werden sie allein über das
 * Textfeld `variantGroup`.
 *
 * WARUM IN CODE GRUPPIERT UND NICHT ABGEFRAGT: Eine Abfrage mit
 * `variantGroup: { equals: … }` wäre in SQLite exakt und damit empfindlich
 * gegen Groß- und Kleinschreibung. Da der Shop keine dreistellige Zahl an
 * Produkten hat und die Produktseite ohnehin schon alle lädt, wird hier
 * stattdessen über einen vereinheitlichten Schlüssel verglichen. Das überlebt
 * „Race 55 Ah", „race 55 ah" und ein verirrtes doppeltes Leerzeichen.
 */

/** Vereinheitlichter Vergleichsschlüssel einer Baureihe. */
export const baureihenSchluessel = (wert: unknown): string =>
  typeof wert === 'string' ? wert.trim().replace(/\s+/g, ' ').toLowerCase() : ''

/**
 * Die Bauformen einer Baureihe, einschließlich des Produkts selbst.
 *
 * Gibt eine leere Liste zurück, wenn das Produkt keine Baureihe trägt oder als
 * einziges in seiner Baureihe steht — dann hat eine Auswahl keinen Sinn und die
 * Produktseite lässt den Abschnitt weg.
 *
 * Die Reihenfolge ist die der übergebenen Liste; `getProducts` sortiert nach
 * `sortOrder`, womit die Reihenfolge im Backend auch die der Schaltflächen ist.
 */
export const bauformen = (produkt: Product, alle: Product[]): Product[] => {
  const schluessel = baureihenSchluessel(produkt.variantGroup)
  if (!schluessel) return []
  const gruppe = alle.filter((p) => baureihenSchluessel(p.variantGroup) === schluessel)
  return gruppe.length > 1 ? gruppe : []
}

/**
 * Die Abmessung aus dem Datenblatt, als Begründung unter der Bauform.
 *
 * Gelesen wird die Datenblattzeile, deren Beschriftung mit „Abmessung" beginnt
 * — so bleibt der Zusatz „(L x B x H)" frei änderbar. Fehlt die Zeile, gibt es
 * eben keine Maße an der Schaltfläche; die Auswahl funktioniert trotzdem.
 */
export const abmessung = (produkt: Product): string | null => {
  const zeile = (produkt.specs ?? []).find((s) => typeof s?.label === 'string' && s.label.trim().startsWith('Abmessung'))
  const wert = zeile?.value
  return typeof wert === 'string' && wert.trim() ? wert.trim() : null
}

/** Beschriftung einer Schaltfläche; fällt auf den Produktnamen zurück. */
export const bauformName = (produkt: Product): string =>
  typeof produkt.variantLabel === 'string' && produkt.variantLabel.trim() ? produkt.variantLabel.trim() : produkt.title
