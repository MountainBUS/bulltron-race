import type { Category, Product } from '../payload-types'

/**
 * Hilfsmittel rund um die Kategorien eines Produkts.
 *
 * Seit eine Batterie in mehreren Kategorien stehen darf, ist `product.category`
 * eine Liste. Je nach `depth` der Abfrage enthält sie entweder die vollen
 * Kategorie-Objekte oder nur deren IDs — beides kommt im Projekt vor, deshalb
 * fangen die Helfer hier beides ab.
 *
 * Die REIHENFOLGE ist die aus dem Backend, und sie bedeutet etwas: Die oberste
 * Kategorie gilt als Hauptkategorie. Sie steht in der Brotkrumen-Navigation,
 * hinter dem Rücksprung von der Produktseite und über den weiteren Modellen.
 * Redaktionell ändert man sie durch Ziehen in der Seitenleiste.
 */

/** Die Kategorien eines Produkts als Objekte, in der Reihenfolge des Backends. */
export const produktKategorien = (produkt: Product): Category[] =>
  (Array.isArray(produkt.category) ? produkt.category : [produkt.category]).filter(
    (eintrag): eintrag is Category => typeof eintrag === 'object' && eintrag !== null,
  )

/**
 * Die Hauptkategorie, also die oberste.
 *
 * Gibt null zurück, wenn die Abfrage die Kategorien nicht aufgelöst hat oder das
 * Produkt keine hat. Beides darf im Frontend nicht zum Absturz führen; die
 * betroffenen Stellen lassen den Abschnitt dann einfach weg.
 */
export const hauptKategorie = (produkt: Product): Category | null => produktKategorien(produkt)[0] ?? null

/**
 * Steht das Produkt in dieser Kategorie?
 *
 * Vergleicht auch dann richtig, wenn die Abfrage nur IDs geliefert hat.
 */
export const inKategorie = (produkt: Product, kategorieId: number | string): boolean =>
  (Array.isArray(produkt.category) ? produkt.category : [produkt.category]).some((eintrag) => {
    const id = typeof eintrag === 'object' && eintrag !== null ? eintrag.id : eintrag
    return id === kategorieId
  })
