import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`teams_drivers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`role\` text,
  	\`photo_id\` integer,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_drivers_order_idx\` ON \`teams_drivers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`teams_drivers_parent_id_idx\` ON \`teams_drivers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_drivers_photo_idx\` ON \`teams_drivers\` (\`photo_id\`);`)
  await db.run(sql`CREATE TABLE \`teams_social\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_social_order_idx\` ON \`teams_social\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`teams_social_parent_id_idx\` ON \`teams_social\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`teams_vehicles\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`manufacturer\` text,
  	\`model\` text,
  	\`year\` text,
  	\`engine\` text,
  	\`modifications\` text,
  	\`battery_id\` integer,
  	\`battery_other\` text,
  	\`since\` text,
  	\`reason\` text,
  	\`experience\` text,
  	\`photo_id\` integer,
  	FOREIGN KEY (\`battery_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_vehicles_order_idx\` ON \`teams_vehicles\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`teams_vehicles_parent_id_idx\` ON \`teams_vehicles\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_vehicles_battery_idx\` ON \`teams_vehicles\` (\`battery_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_vehicles_photo_idx\` ON \`teams_vehicles\` (\`photo_id\`);`)
  await db.run(sql`CREATE TABLE \`teams_results\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`date\` text,
  	\`event\` text NOT NULL,
  	\`placement\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_results_order_idx\` ON \`teams_results\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`teams_results_parent_id_idx\` ON \`teams_results\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`teams_past_achievements\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`year\` text,
  	\`title\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_past_achievements_order_idx\` ON \`teams_past_achievements\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`teams_past_achievements_parent_id_idx\` ON \`teams_past_achievements\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`teams_upcoming\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`date\` text NOT NULL,
  	\`event\` text NOT NULL,
  	\`track\` text,
  	\`url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_upcoming_order_idx\` ON \`teams_upcoming\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`teams_upcoming_parent_id_idx\` ON \`teams_upcoming\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`teams_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer NOT NULL,
  	\`caption\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`teams_gallery_order_idx\` ON \`teams_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`teams_gallery_parent_id_idx\` ON \`teams_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_gallery_image_idx\` ON \`teams_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`teams\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`team_name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`published\` integer DEFAULT true,
  	\`featured\` integer DEFAULT false,
  	\`sort_order\` numeric DEFAULT 0,
  	\`location\` text,
  	\`series\` text,
  	\`intro\` text,
  	\`contact_name\` text,
  	\`contact_email\` text,
  	\`contact_public\` integer DEFAULT false,
  	\`website\` text,
  	\`logo_id\` integer,
  	\`main_image_id\` integer,
  	\`internal_note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`main_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`teams_slug_idx\` ON \`teams\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`teams_logo_idx\` ON \`teams\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_main_image_idx\` ON \`teams\` (\`main_image_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_updated_at_idx\` ON \`teams\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`teams_created_at_idx\` ON \`teams\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`teams_id\` integer REFERENCES teams(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`teams_drivers\`;`)
  await db.run(sql`DROP TABLE \`teams_social\`;`)
  await db.run(sql`DROP TABLE \`teams_vehicles\`;`)
  await db.run(sql`DROP TABLE \`teams_results\`;`)
  await db.run(sql`DROP TABLE \`teams_past_achievements\`;`)
  await db.run(sql`DROP TABLE \`teams_upcoming\`;`)
  await db.run(sql`DROP TABLE \`teams_gallery\`;`)
  await db.run(sql`DROP TABLE \`teams\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	\`categories_id\` integer,
  	\`dealers_id\` integer,
  	\`orders_id\` integer,
  	\`pages_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dealers_id\`) REFERENCES \`dealers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`orders_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "products_id", "categories_id", "dealers_id", "orders_id", "pages_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "products_id", "categories_id", "dealers_id", "orders_id", "pages_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_dealers_id_idx\` ON \`payload_locked_documents_rels\` (\`dealers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
}
