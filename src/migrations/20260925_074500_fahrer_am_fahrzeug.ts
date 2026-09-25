import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Ein Feld „Fahrer" am Fahrzeug eines Rennteams.
 *
 * Bis hierher kannte ein Fahrzeug keinen Fahrer. Bei einem Team mit einem Auto
 * fällt das nicht auf; sobald ein Team mehrere Fahrer und mehrere Fahrzeuge
 * einsetzt, stehen die Autos ohne Zuordnung auf der Seite.
 *
 * HANDGESCHRIEBEN, aus demselben Grund wie bei `verkaeufer_hinweis`:
 * `payload migrate:create` baut für eine neue Spalte die ganze Tabelle neu auf
 * und kopiert die Daten mit INSERT ... SELECT herüber — samt der neuen Spalte,
 * die es in der alten Tabelle noch nicht gibt. Das scheitert beim Start des
 * Containers. Ein ALTER TABLE ADD COLUMN reicht hier vollkommen: Die Spalte ist
 * optional, bestehende Zeilen bekommen NULL, und genau das ist gewollt.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`teams_vehicles\` ADD COLUMN \`driver\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite kann seit 3.35 Spalten entfernen; die Version im Image kann das.
  await db.run(sql`ALTER TABLE \`teams_vehicles\` DROP COLUMN \`driver\`;`)
}
