import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`ean\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`shipping_weight\` numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`ean\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`shipping_weight\`;`)
}
