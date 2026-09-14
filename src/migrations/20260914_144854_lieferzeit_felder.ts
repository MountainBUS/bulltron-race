import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`delivery_days_min\` numeric;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`delivery_days_max\` numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`delivery_days_min\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`delivery_days_max\`;`)
}
