import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Zwei Felder für den Hinweis auf den Verkäufer in den Website-Einstellungen.
 *
 * HANDGESCHRIEBEN — und das mit Absicht.
 *
 * `payload migrate:create` hat für diese Änderung ein Skript erzeugt, das die
 * Tabelle `site_settings` neu aufbaut und die Daten mit einem INSERT ... SELECT
 * herüberkopiert. In der Spaltenliste dieses SELECT standen auch die beiden
 * *neuen* Spalten — die es in der alten Tabelle noch gar nicht gibt. Das Skript
 * scheitert deshalb zuverlässig:
 *
 *     SQLITE_ERROR: no such column: seller_notice_title
 *
 * Der Container führt die Migrationen beim Start aus und bricht bei einem
 * Fehler ab (`set -e` in docker-entrypoint.sh). Das Skript hätte die Instanz
 * also nicht nur nicht aktualisiert, sondern gar nicht erst hochkommen lassen.
 * Aufgefallen ist es nur, weil die Migration vorher gegen eine Datenbank
 * geprüft wurde, die exakt dem Stand der laufenden Instanz entspricht.
 *
 * Handgeschrieben braucht es den Umbau überhaupt nicht: SQLite kann Spalten
 * anfügen, und ein konstanter Vorgabewert wird dabei auch für die vorhandene
 * Zeile gesetzt. Damit steht der Hinweis nach der Migration sofort richtig in
 * den Einstellungen; ein nachträgliches Füllskript entfällt.
 *
 * Nebenwirkung, die der Generator ebenfalls wollte: ein kompletter Neuaufbau
 * der Tabelle `products`, nur um den Vorgabewert der Spalte `delivery_time`
 * zu entfernen. Vorgabewerte auf Spaltenebene setzt Payload ohnehin selbst,
 * für vorhandene Zeilen ändert sich dadurch nichts — der Umbau bleibt weg.
 */

/* Die Texte stehen unten als Literal im SQL, nicht als eingesetzter Wert:
   SQLite nimmt für einen Vorgabewert nur eine Konstante an, kein gebundenes
   Parameterzeichen. Mit `${...}` im sql-Tag wird daraus ein Parameter, und
   SQLite quittiert das mit einem Syntaxfehler. */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD COLUMN \`seller_notice_title\` text DEFAULT 'Versand und Rechnung über die ProVerDa GmbH';`,
  )
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD COLUMN \`seller_notice_text\` text DEFAULT 'Diesen Shop betreibt die ProVerDa GmbH. Sie ist Ihre Vertragspartnerin, übernimmt Versand und Distribution und stellt Ihnen die Rechnung. Die Batterien der Marke BULLTRON RACE werden von der BULLTRON GmbH verantwortet.';`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`seller_notice_text\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`seller_notice_title\`;`)
}
