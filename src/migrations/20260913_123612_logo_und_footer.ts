import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`footer_logo_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`site_settings_footer_logo_idx\` ON \`site_settings\` (\`footer_logo_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text DEFAULT 'BULLTRON RACE',
  	\`tagline\` text DEFAULT 'Faster is always better.',
  	\`logo_id\` integer,
  	\`default_seo_description\` text,
  	\`default_seo_image_id\` integer,
  	\`header_cta_label\` text DEFAULT 'Jetzt beraten lassen',
  	\`header_cta_url\` text DEFAULT 'tel:+4936134948420',
  	\`announcement\` text,
  	\`company_name\` text DEFAULT 'BULLTRON GmbH',
  	\`street\` text DEFAULT 'Bei den Linden 7a',
  	\`postal_code\` text DEFAULT '21449',
  	\`city\` text DEFAULT 'Radbruch',
  	\`phone\` text DEFAULT '+49 361 34948420',
  	\`mobile\` text DEFAULT '+49 157 53705942',
  	\`email\` text DEFAULT 'info@bulltron-race.de',
  	\`opening_hours\` text DEFAULT 'Mo–Fr 8:00–17:00 Uhr',
  	\`footer_text\` text,
  	\`copyright\` text DEFAULT '© BULLTRON GmbH',
  	\`payment_note\` text DEFAULT 'Sichere Zahlung über Stripe — Kreditkarte, Apple Pay, Google Pay, Klarna',
  	\`shipping_cost\` numeric DEFAULT 6.9,
  	\`free_shipping_from\` numeric DEFAULT 250,
  	\`tax_rate\` numeric DEFAULT 19,
  	\`checkout_note\` text,
  	\`legal_price_note\` text DEFAULT 'Alle Preise inkl. gesetzlicher MwSt., zzgl. Versandkosten.',
  	\`legal_terms_url\` text DEFAULT '/agb',
  	\`legal_privacy_url\` text DEFAULT '/datenschutz',
  	\`legal_imprint_url\` text DEFAULT '/impressum',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`default_seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_site_settings\`("id", "site_name", "tagline", "logo_id", "default_seo_description", "default_seo_image_id", "header_cta_label", "header_cta_url", "announcement", "company_name", "street", "postal_code", "city", "phone", "mobile", "email", "opening_hours", "footer_text", "copyright", "payment_note", "shipping_cost", "free_shipping_from", "tax_rate", "checkout_note", "legal_price_note", "legal_terms_url", "legal_privacy_url", "legal_imprint_url", "updated_at", "created_at") SELECT "id", "site_name", "tagline", "logo_id", "default_seo_description", "default_seo_image_id", "header_cta_label", "header_cta_url", "announcement", "company_name", "street", "postal_code", "city", "phone", "mobile", "email", "opening_hours", "footer_text", "copyright", "payment_note", "shipping_cost", "free_shipping_from", "tax_rate", "checkout_note", "legal_price_note", "legal_terms_url", "legal_privacy_url", "legal_imprint_url", "updated_at", "created_at" FROM \`site_settings\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_site_settings\` RENAME TO \`site_settings\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_default_seo_image_idx\` ON \`site_settings\` (\`default_seo_image_id\`);`)
}
