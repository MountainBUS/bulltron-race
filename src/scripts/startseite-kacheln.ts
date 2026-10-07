/**
 * Nimmt die Kachel „Rennsportbatterien" von der Startseite.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/startseite-kacheln.ts
 *
 * Marco am 07.10.2026: Der Bereich wird auf der Startseite nicht gebraucht, es
 * sollen nur noch zwei Kacheln stehen und die volle Breite nutzen. Die
 * Kategorie selbst und ihre Seite bleiben bestehen — entfernt wird allein der
 * Verweis auf der Startseite.
 *
 * Die Breite regelt der Code: Bei zwei Kacheln schaltet die Startseite von
 * `grid--3` auf `grid--2` um, womit sich die beiden die volle Breite teilen.
 * Dieses Skript ändert nur die Daten.
 *
 * MEHRFACH AUSFÜHRBAR: Steht die Kachel schon nicht mehr drin, passiert nichts.
 * Der Einleitungstext wird nur ersetzt, wenn dort noch wörtlich der alte Satz
 * mit „Drei Baureihen" steht — ist er redaktionell geändert worden, bleibt er
 * unangetastet und das Skript sagt Bescheid.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })

const ENTFERNEN = 'rennsportbatterien'
const ALTE_SUBLINE =
  'Drei Baureihen, ein Anspruch: maximale Startleistung bei minimalem Gewicht. Wähle die Kategorie, die zu deinem Fahrzeug passt.'
const NEUE_SUBLINE =
  'Zwei Baureihen, ein Anspruch: maximale Startleistung bei minimalem Gewicht. Wähle die Kategorie, die zu deinem Fahrzeug passt.'

/* Die Kategorie wird über den Slug gesucht, nicht über den Titel: Titel werden
   redaktionell geändert, der Slug nicht. */
const kategorie = (
  await payload.find({
    collection: 'categories',
    where: { slug: { equals: ENTFERNEN } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
).docs[0] as Record<string, any> | undefined

if (!kategorie) {
  payload.logger.info(`Kategorie „${ENTFERNEN}" gibt es nicht — nichts zu entfernen.`)
  process.exit(0)
}

/* depth 0, damit in `category` die reine ID steht und nicht ein ganzes
   Dokument, das beim Zurückschreiben unnötig mitgeschleppt würde. */
const home = (await payload.findGlobal({ slug: 'home', depth: 0, overrideAccess: true })) as Record<string, any>

const kacheln: Record<string, any>[] = Array.isArray(home.categoryCards) ? home.categoryCards : []
const behalten = kacheln.filter((k) => String(k?.category) !== String(kategorie.id))

const daten: Record<string, unknown> = {}
const meldungen: string[] = []

if (behalten.length === kacheln.length) {
  meldungen.push('Die Kachel stand schon nicht mehr auf der Startseite.')
} else {
  daten.categoryCards = behalten.map((k) => ({
    category: k.category,
    text: k.text ?? null,
    image: k.image ?? null,
  }))
  meldungen.push(`Kachel „${kategorie.title ?? ENTFERNEN}" entfernt — es bleiben ${behalten.length}.`)
}

if (home.categoriesSubline === ALTE_SUBLINE) {
  daten.categoriesSubline = NEUE_SUBLINE
  meldungen.push('Einleitungstext von „Drei Baureihen" auf „Zwei Baureihen" gesetzt.')
} else if (typeof home.categoriesSubline === 'string' && home.categoriesSubline.includes('Drei Baureihen')) {
  meldungen.push(
    'ACHTUNG: Im Einleitungstext steht weiterhin „Drei Baureihen", der Text wurde aber redaktionell geändert. Bitte im Backend von Hand anpassen.',
  )
}

if (Object.keys(daten).length > 0) {
  await payload.updateGlobal({ slug: 'home', data: daten as never, overrideAccess: true })
}

for (const m of meldungen) payload.logger.info(m)

const danach = (await payload.findGlobal({ slug: 'home', depth: 1, overrideAccess: true })) as Record<string, any>
const titel = (danach.categoryCards ?? []).map((k: any) => k?.category?.title ?? k?.category)
payload.logger.info(`Kacheln auf der Startseite (${titel.length}): ${titel.join(', ')}`)
if (titel.length !== 2) {
  payload.logger.warn('Erwartet waren zwei Kacheln — bitte im Backend nachsehen.')
}
process.exit(0)
