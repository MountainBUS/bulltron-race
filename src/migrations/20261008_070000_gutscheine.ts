import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Gutscheincodes: eigene Collection plus zwei Felder an der Bestellung.
 *
 * HANDGESCHRIEBEN, aus dem bekannten Grund: `payload migrate:create` baut in
 * diesem Projekt ganze Tabellen neu auf und übersieht die Migrationen ohne
 * `.json`-Schnappschuss. Die Anweisungen hier sind nicht geraten, sondern aus
 * dem Schema abgeschrieben, das Payload selbst erzeugt: Die Collection wurde
 * in eine leere Datenbank gepusht und deren `sqlite_master` ausgelesen.
 *
 * Es kommt nur Neues hinzu — zwei Tabellen, ihre Indizes und zwei optionale
 * Spalten an `orders`. Keine bestehende Tabelle wird umgebaut, es gehen also
 * auch keine Daten verloren.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE \`coupons\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`code\` text NOT NULL,
      \`active\` integer DEFAULT true,
      \`redemptions\` numeric DEFAULT 0,
      \`kind\` text DEFAULT 'percent' NOT NULL,
      \`percent\` numeric,
      \`amount\` numeric,
      \`valid_from\` text,
      \`valid_until\` text,
      \`min_order_value\` numeric,
      \`max_redemptions\` numeric,
      \`internal_note\` text,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`coupons_code_idx\` ON \`coupons\` (\`code\`);`)
  await db.run(sql`CREATE INDEX \`coupons_updated_at_idx\` ON \`coupons\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`coupons_created_at_idx\` ON \`coupons\` (\`created_at\`);`)

  /* Die Beziehungen zu Produkten und Kategorien liegen wie überall bei Payload
     in einer eigenen `_rels`-Tabelle, nicht als Spalte. */
  await db.run(sql`
    CREATE TABLE \`coupons_rels\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`order\` integer,
      \`parent_id\` integer NOT NULL,
      \`path\` text NOT NULL,
      \`products_id\` integer,
      \`categories_id\` integer,
      FOREIGN KEY (\`parent_id\`) REFERENCES \`coupons\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX \`coupons_rels_order_idx\` ON \`coupons_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`coupons_rels_parent_idx\` ON \`coupons_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`coupons_rels_path_idx\` ON \`coupons_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`coupons_rels_products_id_idx\` ON \`coupons_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`coupons_rels_categories_id_idx\` ON \`coupons_rels\` (\`categories_id\`);`)

  /* An der Bestellung: der abgezogene Betrag und der Code, mit dem er zustande
     kam. Beide optional — Bestellungen ohne Gutschein lassen sie leer. */
  await db.run(sql`ALTER TABLE \`orders\` ADD COLUMN \`discount\` numeric;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD COLUMN \`coupon_code\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`coupons_rels\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`coupons\`;`)
  /* Auf beiden Spalten liegt kein Index und kein Fremdschlüssel, deshalb lässt
     SQLite sie auch wieder fallen. */
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`coupon_code\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`discount\`;`)
}
