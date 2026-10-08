import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Rechnungsadresse an der Bestellung.
 *
 * Stripe erhebt Liefer- und Rechnungsanschrift getrennt, gespeichert wurde
 * bisher nur die Lieferanschrift. Auf der Rechnung muss nach § 14 Abs. 4 Nr. 1
 * UStG die Anschrift des Leistungsempfängers stehen — wer an eine Werkstatt
 * oder als Geschenk liefern lässt, bekäme sonst eine Rechnung auf die falsche
 * Adresse.
 *
 * Nur neue, optionale Spalten; bestehende Bestellungen lassen sie leer, und die
 * Rechnung fällt dort auf die Lieferanschrift zurück.
 *
 * Die Spaltennamen sind nicht geraten, sondern aus dem Schema abgeschrieben,
 * das Payload selbst in eine leere Datenbank pusht.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders\` ADD COLUMN \`billing_address_line1\` text;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD COLUMN \`billing_address_line2\` text;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD COLUMN \`billing_address_postal_code\` text;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD COLUMN \`billing_address_city\` text;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD COLUMN \`billing_address_country\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`billing_address_country\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`billing_address_city\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`billing_address_postal_code\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`billing_address_line2\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`billing_address_line1\`;`)
}
