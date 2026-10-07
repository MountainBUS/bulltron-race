import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Zwei Felder am Produkt für die Bauform-Varianten.
 *
 * `variant_group` fasst Batterien zusammen, die elektrisch gleich sind und sich
 * nur im Gehäuse unterscheiden (die 55 Ah als L1 und L2, die 27 Ah als Metall,
 * L1, L2 und L3). `variant_label` ist die kurze Beschriftung der Schaltfläche
 * in der Auswahl.
 *
 * HANDGESCHRIEBEN, aus dem bekannten Grund: `payload migrate:create` baut für
 * neue Spalten die ganze Tabelle neu auf und kopiert die Daten mit
 * INSERT ... SELECT hinüber — samt der neuen Spalten, die es in der alten
 * Tabelle noch nicht gibt. Hier reichen zwei ALTER TABLE ADD COLUMN: Beide
 * Spalten sind optional, bestehende Zeilen bekommen NULL, und genau das ist
 * gewollt — Batterien ohne Geschwister bleiben leer und zeigen keine Auswahl.
 *
 * Anders als bei `kategorien_mehrfach` ist hier kein Umbau nötig: Es kommen nur
 * Spalten dazu, es verschwindet keine, und ein Fremdschlüssel ist nicht im
 * Spiel.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD COLUMN \`variant_group\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD COLUMN \`variant_label\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  /* Auf beiden Spalten liegt kein Index und kein Fremdschlüssel, deshalb lässt
     SQLite sie hier auch wieder fallen — anders als bei `category_id`. */
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`variant_label\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`variant_group\`;`)
}
