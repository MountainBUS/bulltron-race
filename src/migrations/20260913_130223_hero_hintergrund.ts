import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home\` ADD \`background_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`home\` ADD \`background_focus\` text DEFAULT 'center-right';`)
  await db.run(sql`CREATE INDEX \`home_background_image_idx\` ON \`home\` (\`background_image_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text DEFAULT 'Made in Germany',
  	\`headline\` text NOT NULL,
  	\`headline_accent\` text,
  	\`subline\` text,
  	\`primary_cta_label\` text DEFAULT 'Batterien ansehen',
  	\`primary_cta_url\` text DEFAULT '/produkte',
  	\`secondary_cta_label\` text DEFAULT 'Beratung anrufen',
  	\`secondary_cta_url\` text DEFAULT 'tel:+4936134948420',
  	\`image_id\` integer,
  	\`teaser_enabled\` integer DEFAULT true,
  	\`teaser_eyebrow\` text,
  	\`teaser_headline\` text,
  	\`teaser_text\` text,
  	\`teaser_image_id\` integer,
  	\`teaser_image_position\` text DEFAULT 'right',
  	\`teaser_cta_label\` text,
  	\`teaser_cta_url\` text,
  	\`categories_headline\` text DEFAULT 'Für jede Disziplin die passende Batterie',
  	\`categories_subline\` text,
  	\`products_headline\` text DEFAULT 'Unsere Bestseller',
  	\`products_subline\` text,
  	\`video_section_enabled\` integer DEFAULT true,
  	\`video_section_eyebrow\` text DEFAULT 'Bulltron Race TV',
  	\`video_section_headline\` text DEFAULT 'Sieh die Technik in Aktion',
  	\`video_section_subline\` text,
  	\`usp_headline\` text DEFAULT 'Warum Bulltron Race',
  	\`partner_headline\` text DEFAULT 'Im Renneinsatz bewährt',
  	\`cta_band_enabled\` integer DEFAULT true,
  	\`cta_band_headline\` text,
  	\`cta_band_text\` text,
  	\`cta_band_cta_label\` text,
  	\`cta_band_cta_url\` text,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_image_id\` integer,
  	\`seo_noindex\` integer DEFAULT false,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`teaser_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_home\`("id", "eyebrow", "headline", "headline_accent", "subline", "primary_cta_label", "primary_cta_url", "secondary_cta_label", "secondary_cta_url", "image_id", "teaser_enabled", "teaser_eyebrow", "teaser_headline", "teaser_text", "teaser_image_id", "teaser_image_position", "teaser_cta_label", "teaser_cta_url", "categories_headline", "categories_subline", "products_headline", "products_subline", "video_section_enabled", "video_section_eyebrow", "video_section_headline", "video_section_subline", "usp_headline", "partner_headline", "cta_band_enabled", "cta_band_headline", "cta_band_text", "cta_band_cta_label", "cta_band_cta_url", "seo_title", "seo_description", "seo_image_id", "seo_noindex", "updated_at", "created_at") SELECT "id", "eyebrow", "headline", "headline_accent", "subline", "primary_cta_label", "primary_cta_url", "secondary_cta_label", "secondary_cta_url", "image_id", "teaser_enabled", "teaser_eyebrow", "teaser_headline", "teaser_text", "teaser_image_id", "teaser_image_position", "teaser_cta_label", "teaser_cta_url", "categories_headline", "categories_subline", "products_headline", "products_subline", "video_section_enabled", "video_section_eyebrow", "video_section_headline", "video_section_subline", "usp_headline", "partner_headline", "cta_band_enabled", "cta_band_headline", "cta_band_text", "cta_band_cta_label", "cta_band_cta_url", "seo_title", "seo_description", "seo_image_id", "seo_noindex", "updated_at", "created_at" FROM \`home\`;`)
  await db.run(sql`DROP TABLE \`home\`;`)
  await db.run(sql`ALTER TABLE \`__new_home\` RENAME TO \`home\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`home_image_idx\` ON \`home\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`home_teaser_teaser_image_idx\` ON \`home\` (\`teaser_image_id\`);`)
  await db.run(sql`CREATE INDEX \`home_seo_seo_image_idx\` ON \`home\` (\`seo_image_id\`);`)
}
