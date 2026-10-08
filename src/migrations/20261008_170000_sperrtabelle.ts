import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Nachtrag an `payload_locked_documents_rels` für Gutscheine und Rechnungen.
 *
 * WAS GEFEHLT HAT: Payload sperrt ein Dokument, solange es jemand im Backend
 * geöffnet hat, und merkt sich das in dieser Tabelle — mit je einer Spalte pro
 * Collection. Die Migrationen für `coupons` und `invoices` haben die Tabelle
 * nicht mitgezogen. Payload selbst legt die Spalten an, wenn es das Schema in
 * eine leere Datenbank schreibt; auf Dev und Live laufen aber die Migrationen,
 * und dort fehlten sie. Die erste Folge wäre gewesen, dass sich ein Gutschein
 * oder eine Rechnung im Backend nicht öffnen lässt.
 *
 * Gefunden durch einen Vergleich: einmal alle Migrationen auf eine leere
 * Datenbank, einmal Payload sein Schema selbst schreiben lassen, danach Tabelle
 * für Tabelle die Spalten gegenübergestellt.
 *
 * SQLite nimmt eine neue Spalte mit Fremdschlüssel an, solange ihr Standardwert
 * NULL ist — hier der Fall, es ist also kein Umbau der Tabelle nötig.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`coupons_id\` integer REFERENCES \`coupons\`(\`id\`) ON UPDATE no action ON DELETE cascade;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`invoices_id\` integer REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_coupons_id_idx\` ON \`payload_locked_documents_rels\` (\`coupons_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_invoices_id_idx\` ON \`payload_locked_documents_rels\` (\`invoices_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_invoices_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_coupons_id_idx\`;`)
  /* Die beiden Spalten tragen einen Fremdschlüssel; SQLite lässt sie deshalb
     nicht einfach fallen. Sie bleiben stehen und stören nicht — leere Spalten
     ohne Inhalt. */
}
