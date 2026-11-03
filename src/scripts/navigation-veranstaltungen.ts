/**
 * Trägt die Veranstaltungsseite in Navigation und Footer ein — einmalig auf
 * einer bestehenden Instanz.
 *
 * Hintergrund wie bei navigation-teams.ts: Navigation und Footer sind
 * gepflegte Inhalte, keine Struktur. Sie stehen im Seed, und der Seed läuft
 * auf einer laufenden Instanz nicht noch einmal — er würde alle Inhalte
 * löschen. Dieses Skript ergänzt deshalb nur die beiden fehlenden Einträge
 * und lässt alles andere unangetastet.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/navigation-veranstaltungen.ts
 *
 * Mehrfach ausführbar: bereits vorhandene Einträge werden nicht verdoppelt.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })
const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as Record<string, any>

const hauptnavigation: Array<{ label: string; url: string }> = Array.isArray(settings.mainNav)
  ? [...settings.mainNav]
  : []

let geaendert = false

if (!hauptnavigation.some((eintrag) => eintrag?.url === '/veranstaltungen')) {
  /* Hinter die Teams, weil beides zusammengehört: Wer die Teams anschaut,
     sucht als Nächstes, wann sie fahren. */
  const position = hauptnavigation.findIndex((eintrag) => eintrag?.url === '/teams')
  const neu = { label: 'Termine', url: '/veranstaltungen' }
  if (position >= 0) hauptnavigation.splice(position + 1, 0, neu)
  else hauptnavigation.push(neu)
  geaendert = true
  payload.logger.info('Hauptnavigation: Termine ergänzt')
}

const footer: Array<Record<string, any>> = Array.isArray(settings.footerColumns)
  ? settings.footerColumns.map((spalte: Record<string, any>) => ({
      ...spalte,
      links: Array.isArray(spalte.links) ? [...spalte.links] : spalte.links,
    }))
  : []
for (const spalte of footer) {
  if (spalte?.title !== 'Service' || !Array.isArray(spalte.links)) continue
  if (spalte.links.some((link: Record<string, any>) => link?.url === '/veranstaltungen')) continue
  const position = spalte.links.findIndex((link: Record<string, any>) => link?.url === '/teams')
  const neu = { label: 'Veranstaltungen', url: '/veranstaltungen' }
  if (position >= 0) spalte.links.splice(position + 1, 0, neu)
  else spalte.links.push(neu)
  geaendert = true
  payload.logger.info('Footer: Veranstaltungen ergänzt')
}

if (!geaendert) {
  payload.logger.info('Navigation und Footer führen die Veranstaltungsseite bereits — nichts zu tun.')
  process.exit(0)
}

await payload.updateGlobal({
  slug: 'site-settings',
  overrideAccess: true,
  data: { mainNav: hauptnavigation, footerColumns: footer } as never,
})

payload.logger.info('Gespeichert.')
process.exit(0)
