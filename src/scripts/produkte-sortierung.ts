/**
 * Setzt die Reihenfolge der Batterien in der Übersicht gerade.
 *
 * Im Container ausführen — erst der Probelauf, der nichts verändert:
 *   node_modules/.bin/payload run src/scripts/produkte-sortierung.ts
 *
 * Und wenn die Liste stimmt:
 *   SORTIERUNG_AUSFUEHREN=1 node_modules/.bin/payload run src/scripts/produkte-sortierung.ts
 *
 * WARUM ES DAS GIBT: preisliste-06-2026.ts hat den sechs neuen Ausführungen
 * ihren Platz aus src/seed/products.ts gegeben — also aus der Reihenfolge
 * aller fünfzehn. Die neun vorhandenen behielten aber ihre alten Nummern 1
 * bis 9 aus der Zeit, als es nur sie gab. Dadurch kam es zu doppelten
 * Nummern: die Race 6 Ah und die Race 4 Ah 105 mm standen beide auf 2, die
 * Race 27 Ah Metall und die Race 6 Ah 105 mm beide auf 4. In der Übersicht
 * stand die Race 6 Ah 105 mm deshalb hinter der Race 12 Ah statt neben ihrer
 * Schwester. Das hätte im selben Lauf passieren müssen.
 *
 * WAS ES TUT: Es nummeriert alle Batterien nach der Reihenfolge in
 * src/seed/products.ts durch, 1 bis 15. Produkte, die dort nicht stehen —
 * zum Beispiel das Wallpaper —, bleiben unberührt.
 *
 * MEHRFACH AUSFÜHRBAR: Steht eine Nummer schon richtig, wird nicht
 * geschrieben.
 *
 * ACHTUNG, falls ihr die Reihenfolge im Backend von Hand geändert habt:
 * Dieses Skript setzt sie auf die Reihenfolge der Preisliste zurück. Der
 * Probelauf zeigt vorher genau, was sich ändern würde.
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { seedProducts } from '../seed/products'

const AUSFUEHREN = ['1', 'true', 'ja'].includes(String(process.env.SORTIERUNG_AUSFUEHREN ?? '').toLowerCase())

const payload = await getPayload({ config })

if (!AUSFUEHREN) {
  payload.logger.info('PROBELAUF — es wird nichts verändert. Zum Ausführen SORTIERUNG_AUSFUEHREN=1 setzen.')
} else {
  payload.logger.info('Die Reihenfolge wird gesetzt.')
}
payload.logger.info('')

let geaendert = 0
let schonRichtig = 0
let fehlend = 0

for (const [i, vorgabe] of seedProducts.entries()) {
  const platz = i + 1
  const treffer = await payload.find({
    collection: 'products',
    where: { sku: { equals: vorgabe.sku } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const produkt = treffer.docs[0] as Record<string, any> | undefined

  if (!produkt) {
    payload.logger.error(`${vorgabe.sku}: nicht im Bestand — übersprungen.`)
    fehlend++
    continue
  }

  const jetzt = Number(produkt.sortOrder ?? 0)
  if (jetzt === platz) {
    schonRichtig++
    continue
  }

  payload.logger.info(`${String(vorgabe.sku).padEnd(20)} ${produkt.title}: Platz ${jetzt} → ${platz}`)
  geaendert++

  if (!AUSFUEHREN) continue
  await payload.update({
    collection: 'products',
    id: produkt.id,
    data: { sortOrder: platz } as never,
    overrideAccess: true,
  })
}

/* Die Probe aufs Exempel: Doppelte Nummern sind genau der Fehler, der hier
   behoben werden soll — also wird am Ende nachgezählt, nicht angenommen. */
payload.logger.info('')
const alle = await payload.find({
  collection: 'products',
  limit: 200,
  depth: 0,
  overrideAccess: true,
  sort: 'sortOrder',
})

const belegt = new Map<number, string[]>()
for (const p of alle.docs as Record<string, any>[]) {
  const n = Number(p.sortOrder ?? 0)
  belegt.set(n, [...(belegt.get(n) ?? []), String(p.sku ?? p.title)])
  payload.logger.info(`  ${String(n).padStart(3)}  ${String(p.sku ?? '—').padEnd(20)} ${p.title}  [${p.status}]`)
}

payload.logger.info('')
const doppelt = [...belegt.entries()].filter(([, liste]) => liste.length > 1)
if (doppelt.length === 0) {
  payload.logger.info('Keine doppelten Plätze.')
} else {
  for (const [n, liste] of doppelt) {
    payload.logger.warn(`Platz ${n} ist doppelt belegt: ${liste.join(', ')}`)
  }
}

payload.logger.info('')
if (AUSFUEHREN) {
  payload.logger.info(`Geändert: ${geaendert}, schon richtig: ${schonRichtig}, nicht gefunden: ${fehlend}`)
} else {
  payload.logger.info(`Probelauf: ${geaendert} Produkte bekämen eine neue Nummer, ${schonRichtig} stehen schon richtig.`)
}

process.exit(fehlend > 0 ? 1 : 0)
