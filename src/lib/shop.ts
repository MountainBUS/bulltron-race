/**
 * Schalter für den Shop-Teil der Seite.
 *
 * NEXT_PUBLIC_SHOP_ENABLED=false blendet Warenkorb, Kasse und alle
 * Kaufen-Buttons aus. Die Produktseiten bleiben vollständig, statt des
 * Warenkorbs führt ein Anfrage-Button zu Telefon und E-Mail.
 *
 * Gedacht für den Übergang: Seite ist live, Zahlungsanbindung noch nicht.
 */
export const shopEnabled = process.env.NEXT_PUBLIC_SHOP_ENABLED !== 'false'

export const ANFRAGE_TEL = 'tel:+4936134948420'
export const ANFRAGE_MAIL = 'mailto:info@bulltron-race.de'
