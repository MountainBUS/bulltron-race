import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { de } from '@payloadcms/translations/languages/de'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Dealers } from './collections/Dealers'
import { Pages } from './collections/Pages'
import { Orders } from './collections/Orders'
import { Home } from './globals/Home'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Bulltron Race',
    },
  },
  collections: [Products, Categories, Dealers, Orders, Pages, Media, Users],
  globals: [Home, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:./bulltron.db' },
    // In der Entwicklung schreibt Payload Schemaänderungen direkt in die
    // Datenbank. In der Produktion ist das abgeschaltet — dort zählen die
    // Migrationen in src/migrations, die beim Containerstart laufen.
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
  // Das Backend läuft ausschließlich auf Deutsch.
  i18n: { supportedLanguages: { de }, fallbackLanguage: 'de' },
  upload: { limits: { fileSize: 10_000_000 } },
})
