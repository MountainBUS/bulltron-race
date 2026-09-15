/**
 * Setzt den Betreiber des Shops auf die ProVerDa GmbH — auf einer bereits
 * laufenden Instanz, ohne den Seed erneut auszuführen.
 *
 * Hintergrund: Bis zum 15.09.2026 stand in Impressum, Datenschutzerklärung,
 * AGB und Widerrufsbelehrung durchgehend die BULLTRON GmbH als Betreiberin des
 * Shops. Tatsächlich betreibt die ProVerDa GmbH den Shop und ist damit
 * Vertragspartnerin des Kunden; die BULLTRON GmbH verantwortet die Batterien.
 * Die Telefonnummern auf der Seite waren schon vorher die von ProVerDa.
 *
 * Betroffen sind vier Stellen, die alle rechtlich zusammenhängen:
 *   - Impressum (§ 5 DDG, § 18 Abs. 2 MStV)
 *   - Verantwortlicher der Datenverarbeitung in der Datenschutzerklärung
 *   - Vertragspartner in § 2 der AGB
 *   - Adressat der Widerrufsbelehrung
 * Dazu der Anschriftenblock im Footer (Website-Einstellungen → Kontakt).
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/betreiber-proverda.ts
 *
 * Mehrfach ausführbar: Steht im Impressum bereits die ProVerDa GmbH, passiert
 * nichts. Achtung — die drei Rechtsseiten werden vollständig durch die Fassung
 * aus `src/seed/legal.ts` ersetzt. Von Hand im Backend vorgenommene Änderungen
 * an diesen Seiten gingen dabei verloren; deshalb die Prüfung vorweg.
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { agb, datenschutz, impressum } from '../seed/legal'

/** Sammelt allen Text aus einem Lexical-Dokument ein, egal wie tief verschachtelt. */
const textVon = (knoten: unknown): string => {
  if (Array.isArray(knoten)) return knoten.map(textVon).join(' ')
  if (knoten && typeof knoten === 'object') {
    const o = knoten as Record<string, unknown>
    const eigen = typeof o.text === 'string' ? o.text : ''
    return [eigen, textVon(o.children), textVon(o.root)].filter(Boolean).join(' ')
  }
  return ''
}

const payload = await getPayload({ config })

const seiten: Array<{ slug: string; inhalt: unknown; bezeichnung: string }> = [
  { slug: 'impressum', inhalt: impressum, bezeichnung: 'Impressum' },
  { slug: 'datenschutz', inhalt: datenschutz, bezeichnung: 'Datenschutzerklärung' },
  { slug: 'agb', inhalt: agb, bezeichnung: 'AGB und Widerruf' },
]

const treffer = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'impressum' } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
const impressumsseite = treffer.docs[0] as Record<string, any> | undefined

if (!impressumsseite) {
  payload.logger.error('Keine Seite mit dem Kürzel „impressum" gefunden — es wird nichts geändert.')
  process.exit(1)
}

if (textVon(impressumsseite.content).includes('ProVerDa GmbH')) {
  payload.logger.info('Im Impressum steht bereits die ProVerDa GmbH — nichts zu tun.')
  process.exit(0)
}

for (const { slug, inhalt, bezeichnung } of seiten) {
  const gefunden = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const seite = gefunden.docs[0] as Record<string, any> | undefined
  if (!seite) {
    payload.logger.warn(`Keine Seite mit dem Kürzel „${slug}" — übersprungen.`)
    continue
  }

  await payload.update({
    collection: 'pages',
    id: seite.id,
    overrideAccess: true,
    data: { content: inhalt } as never,
  })
  payload.logger.info(`${bezeichnung}: auf die ProVerDa-Fassung gesetzt`)
}

const einstellungen = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as Record<string, any>

const anschrift = {
  companyName: 'ProVerDa GmbH',
  street: 'An der Lache 40-42',
  postalCode: '99086',
  city: 'Erfurt',
}

const bisher = [einstellungen.companyName, einstellungen.street, einstellungen.postalCode, einstellungen.city]
  .filter(Boolean)
  .join(', ')

await payload.updateGlobal({
  slug: 'site-settings',
  overrideAccess: true,
  data: anschrift as never,
})

payload.logger.info(`Anschrift im Footer: ${bisher || 'leer'} -> ProVerDa GmbH, An der Lache 40-42, 99086 Erfurt`)
payload.logger.info('Fertig.')
process.exit(0)
