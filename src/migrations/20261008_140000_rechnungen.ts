import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Rechnungen: eigene Collection mit angehängtem PDF, dazu sechs Felder an den
 * Website-Einstellungen für die Angaben des Rechnungsausstellers.
 *
 * HANDGESCHRIEBEN und aus dem Schema abgeschrieben, das Payload selbst erzeugt:
 * Die Collection wurde in eine leere Datenbank gepusht und deren
 * `sqlite_master` ausgelesen. Geraten ist hier nichts.
 *
 * Es kommt nur Neues hinzu — zwei Tabellen samt Indizes und sechs optionale
 * Spalten an `site_settings`. Keine bestehende Tabelle wird umgebaut.
 *
 * Die Spalten `url`, `filename`, `mime_type` und die Bildmaße legt Payload für
 * jede Upload-Collection an; `width`, `height` und die Fokuspunkte bleiben bei
 * PDFs leer, gehören aber zum Schema und dürfen deshalb nicht fehlen.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE \`invoices\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`invoice_number\` text NOT NULL,
      \`year\` numeric NOT NULL,
      \`sequence\` numeric NOT NULL,
      \`kind\` text DEFAULT 'invoice' NOT NULL,
      \`invoice_date\` text NOT NULL,
      \`cancelled\` integer DEFAULT false,
      \`net_total\` numeric,
      \`tax_rate\` numeric,
      \`tax_total\` numeric,
      \`gross_total\` numeric,
      \`items_gross\` numeric,
      \`discount_gross\` numeric,
      \`shipping_gross\` numeric,
      \`coupon_code\` text,
      \`customer_name\` text,
      \`email\` text,
      \`address_line1\` text,
      \`address_line2\` text,
      \`address_postal_code\` text,
      \`address_city\` text,
      \`address_country\` text,
      \`order_id\` integer,
      \`order_number\` text,
      \`paid_at\` text,
      \`payment_reference\` text,
      \`cancels_id\` integer,
      \`cancelled_by_id\` integer,
      \`cancellation_reason\` text,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`url\` text,
      \`thumbnail_u_r_l\` text,
      \`filename\` text,
      \`mime_type\` text,
      \`filesize\` numeric,
      \`width\` numeric,
      \`height\` numeric,
      \`focal_x\` numeric,
      \`focal_y\` numeric,
      FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`cancels_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`cancelled_by_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE set null
    );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`invoices_invoice_number_idx\` ON \`invoices\` (\`invoice_number\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`invoices_filename_idx\` ON \`invoices\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`invoices_year_idx\` ON \`invoices\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`invoices_sequence_idx\` ON \`invoices\` (\`sequence\`);`)
  await db.run(sql`CREATE INDEX \`invoices_order_idx\` ON \`invoices\` (\`order_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_cancels_idx\` ON \`invoices\` (\`cancels_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_cancelled_by_idx\` ON \`invoices\` (\`cancelled_by_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_updated_at_idx\` ON \`invoices\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`invoices_created_at_idx\` ON \`invoices\` (\`created_at\`);`)

  await db.run(sql`
    CREATE TABLE \`invoices_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`title\` text,
      \`sku\` text,
      \`quantity\` numeric,
      \`unit_price\` numeric,
      \`line_total\` numeric,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX \`invoices_items_order_idx\` ON \`invoices_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`invoices_items_parent_id_idx\` ON \`invoices_items\` (\`_parent_id\`);`)

  /* Angaben des Rechnungsausstellers. Sie standen bisher nur als Fließtext im
     Impressum; auf der Rechnung müssen sie als pflegbare Felder stehen. */
  for (const spalte of [
    'vat_id',
    'tax_number',
    'register_court',
    'register_number',
    'managing_director',
    'invoice_note',
  ]) {
    await db.run(sql.raw(`ALTER TABLE \`site_settings\` ADD COLUMN \`${spalte}\` text;`))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`invoices_items\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`invoices\`;`)
  for (const spalte of [
    'invoice_note',
    'managing_director',
    'register_number',
    'register_court',
    'tax_number',
    'vat_id',
  ]) {
    await db.run(sql.raw(`ALTER TABLE \`site_settings\` DROP COLUMN \`${spalte}\`;`))
  }
}
