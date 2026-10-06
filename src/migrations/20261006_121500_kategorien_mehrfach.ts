import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Eine Batterie darf in mehreren Kategorien stehen.
 *
 * Bis hierher war `category` eine einfache Beziehung: eine Spalte
 * `products.category_id`. Mit `hasMany` legt Payload die Zuordnung statt dessen
 * in einer eigenen Tabelle `products_rels` ab — dieselbe Form, die `home_rels`
 * schon hat.
 *
 * HANDGESCHRIEBEN, und hier aus einem schwerwiegenderen Grund als sonst.
 * `payload migrate:create` liefert für diesen Schritt zwei Fehler:
 *
 *   1. DATENVERLUST. Der Generator baut `products` neu auf und kopiert die
 *      Zeilen mit INSERT ... SELECT hinüber — ohne `category_id`, denn die
 *      Spalte gibt es dort nicht mehr. Die bestehenden Zuordnungen rettet er
 *      aber nirgendwohin. Nach seiner Migration stünde jedes Produkt ohne
 *      Kategorie da.
 *   2. Er gibt zusätzlich `ALTER TABLE teams_vehicles ADD driver text;` aus,
 *      weil die Migration `fahrer_am_fahrzeug` handgeschrieben ist und deshalb
 *      keinen .json-Schnappschuss hat, den der Generator kennt. Auf einer
 *      Datenbank, die diese Spalte längst hat, scheitert das an
 *      „duplicate column name".
 *
 * Diese Fassung macht es in der Reihenfolge, auf die es ankommt: erst die neue
 * Tabelle, dann den Bestand hinüberretten, und erst danach die alte Spalte.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  /* 1. Die Beziehungstabelle, Form wie von Payload erwartet. */
  await db.run(sql`CREATE TABLE \`products_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`categories_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`products_rels_order_idx\` ON \`products_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_parent_idx\` ON \`products_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_path_idx\` ON \`products_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_categories_id_idx\` ON \`products_rels\` (\`categories_id\`);`)

  /* 2. Bestand hinüberretten. Das ist der Schritt, den der Generator vergisst.
        Jedes Produkt behält seine bisherige Kategorie, und zwar an Position 1 —
        damit bleibt sie auch die Hauptkategorie. */
  await db.run(sql`
    INSERT INTO \`products_rels\` (\`order\`, \`parent_id\`, \`path\`, \`categories_id\`)
    SELECT 1, \`id\`, 'category', \`category_id\`
    FROM \`products\`
    WHERE \`category_id\` IS NOT NULL;
  `)

  /* 3. Erst jetzt die alte Spalte weg. Ein schlichtes DROP COLUMN geht nicht:
        Auf `category_id` liegt ein Fremdschlüssel, und SQLite lehnt das ab mit
        „unknown column category_id in foreign key definition". Bleibt der Weg
        über eine neue Tabelle — derselbe, den der Generator wählt. Die folgenden
        Anweisungen sind wörtlich seine, weil die Spaltenliste aus Payloads
        eigenem Schema stammt und von Hand nur falsch werden kann. Entscheidend
        ist, dass sie NACH Schritt 2 stehen: Der Bestand ist dann schon
        gerettet, und dass `category_id` beim Kopieren fehlt, ist richtig so. */
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`status\` text DEFAULT 'published' NOT NULL,
  	\`sort_order\` numeric DEFAULT 0,
  	\`featured\` integer DEFAULT false,
  	\`subtitle\` text,
  	\`badge\` text,
  	\`short_description\` text,
  	\`key_data_voltage\` text,
  	\`key_data_capacity\` text,
  	\`key_data_current\` text,
  	\`key_data_weight\` text,
  	\`price\` numeric NOT NULL,
  	\`compare_at_price\` numeric,
  	\`sku\` text,
  	\`availability\` text DEFAULT 'in_stock',
  	\`delivery_time\` text,
  	\`ean\` text,
  	\`shipping_weight\` numeric,
  	\`shipping_note\` text,
  	\`main_image_id\` integer,
  	\`video_url\` text,
  	\`video_title\` text DEFAULT 'Das Produkt im Einsatz',
  	\`video_description\` text,
  	\`video_preview_image_id\` integer,
  	\`description\` text,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_image_id\` integer,
  	\`seo_noindex\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`main_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`video_preview_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products\`("id", "title", "slug", "status", "sort_order", "featured", "subtitle", "badge", "short_description", "key_data_voltage", "key_data_capacity", "key_data_current", "key_data_weight", "price", "compare_at_price", "sku", "availability", "delivery_time", "ean", "shipping_weight", "shipping_note", "main_image_id", "video_url", "video_title", "video_description", "video_preview_image_id", "description", "seo_title", "seo_description", "seo_image_id", "seo_noindex", "updated_at", "created_at") SELECT "id", "title", "slug", "status", "sort_order", "featured", "subtitle", "badge", "short_description", "key_data_voltage", "key_data_capacity", "key_data_current", "key_data_weight", "price", "compare_at_price", "sku", "availability", "delivery_time", "ean", "shipping_weight", "shipping_note", "main_image_id", "video_url", "video_title", "video_description", "video_preview_image_id", "description", "seo_title", "seo_description", "seo_image_id", "seo_noindex", "updated_at", "created_at" FROM \`products\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`ALTER TABLE \`__new_products\` RENAME TO \`products\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_main_image_idx\` ON \`products\` (\`main_image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_video_video_preview_image_idx\` ON \`products\` (\`video_preview_image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_seo_seo_image_idx\` ON \`products\` (\`seo_image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  /* Zurück auf eine Spalte: Jedes Produkt bekommt seine erste Kategorie. Stand
     ein Produkt in mehreren, gehen die übrigen Zuordnungen verloren — anders ist
     es nicht zurückzudrehen, eine Spalte fasst nur einen Wert.

     Die Spalte wird ohne NOT NULL angelegt: SQLite lässt ALTER TABLE ADD COLUMN
     mit NOT NULL und ohne Vorgabewert auf einer gefüllten Tabelle nicht zu. Die
     Werte stehen danach trotzdem alle drin, nur die Zusicherung auf
     Datenbankebene fehlt. Payload erzwingt sie weiterhin über `required: true`. */
  await db.run(sql`ALTER TABLE \`products\` ADD COLUMN \`category_id\` integer REFERENCES \`categories\`(\`id\`);`)
  await db.run(sql`
    UPDATE \`products\`
    SET \`category_id\` = (
      SELECT \`categories_id\` FROM \`products_rels\`
      WHERE \`parent_id\` = \`products\`.\`id\` AND \`path\` = 'category'
      ORDER BY \`order\`
      LIMIT 1
    );
  `)
  await db.run(sql`CREATE INDEX \`products_category_idx\` ON \`products\` (\`category_id\`);`)
  await db.run(sql`DROP TABLE \`products_rels\`;`)
}
