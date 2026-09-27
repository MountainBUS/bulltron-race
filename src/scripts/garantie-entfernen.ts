/**
 * Nimmt die Fünf-Jahres-Garantie aus allen Inhalten und setzt an die Stelle
 * der Startseiten-Kachel den Hinweis, dass kein besonderes Ladegerät nötig ist.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/garantie-entfernen.ts
 *
 * Mehrfach ausführbar: Was schon geändert ist, bleibt unangetastet. Das Skript
 * sagt am Ende, was es tatsächlich angefasst hat.
 *
 * Von Marco am 27.09.2026 entschieden: Die Garantie wird vorerst komplett
 * weggelassen, einschließlich der Zusage in § 8 der AGB — eine Garantie, die
 * nirgends mehr beworben wird, gehört auch nicht in den Vertragstext. Der
 * gesetzliche Teil von § 8 bleibt unberührt.
 *
 * Die hartkodierten Stellen (Fußzeile, Produktdetailseite, Produktübersicht)
 * stecken im Code und sind mit dem zugehörigen Commit erledigt; dieses Skript
 * kümmert sich nur um die Inhalte in der Datenbank.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })

const KACHEL = {
  icon: 'plug',
  title: 'Kein Spezialladegerät nötig',
  text: 'Zum Laden ist kein besonderes Ladegerät erforderlich.',
}

const treffer = (wert: unknown): boolean => typeof wert === 'string' && /arantie/.test(wert)

const geaendert: string[] = []

/* --- Rich Text --------------------------------------------------------------
   Der Lexical-Baum wird rekursiv abgesucht. Entfernt werden ganze Knoten, deren
   Text die Garantie nennt — bei den Produkten ist das ein Listenpunkt, in den
   AGB sind es zwei Absätze. */
const knotenText = (knoten: any): string => {
  if (!knoten || typeof knoten !== 'object') return ''
  if (typeof knoten.text === 'string') return knoten.text
  if (Array.isArray(knoten.children)) return knoten.children.map(knotenText).join('')
  return ''
}

/** Entfernt Listenpunkte und Absätze, die die Garantie nennen. */
const knotenOhneGarantie = (knoten: any): any => {
  if (!knoten || typeof knoten !== 'object' || !Array.isArray(knoten.children)) return knoten
  const kinder = knoten.children
    .filter((kind: any) => {
      const entfernbar = kind?.type === 'listitem' || kind?.type === 'paragraph'
      return !(entfernbar && /arantie/.test(knotenText(kind)))
    })
    .map(knotenOhneGarantie)
  return { ...knoten, children: kinder }
}

/** Nach dem Entfernen eines Listenpunkts sind die `value`-Nummern lückenhaft. */
const nummerierungRichten = (knoten: any): any => {
  if (!knoten || typeof knoten !== 'object' || !Array.isArray(knoten.children)) return knoten
  const kinder = knoten.children.map(nummerierungRichten)
  if (knoten.type === 'list') {
    return { ...knoten, children: kinder.map((k: any, i: number) => (k?.type === 'listitem' ? { ...k, value: i + 1 } : k)) }
  }
  return { ...knoten, children: kinder }
}

/* --- Startseite ------------------------------------------------------------ */
const home = (await payload.findGlobal({ slug: 'home', depth: 0, overrideAccess: true })) as Record<string, any>
const homeDaten: Record<string, unknown> = {}

if (Array.isArray(home.usps)) {
  const index = home.usps.findIndex((u: any) => treffer(u?.title) || treffer(u?.text))
  if (index >= 0) {
    const neu = [...home.usps]
    neu[index] = { ...neu[index], ...KACHEL }
    homeDaten.usps = neu
    geaendert.push(`Startseite: Kachel „${home.usps[index].title}" ersetzt durch „${KACHEL.title}"`)
  }
}

/* Kennzahl „5 Jahre / Herstellergarantie" im Kopf der Startseite. */
if (Array.isArray(home.stats)) {
  const neu = home.stats.filter((z: any) => !treffer(z?.label) && !treffer(z?.value))
  if (neu.length !== home.stats.length) {
    homeDaten.stats = neu
    geaendert.push('Startseite: Kennzahl entfernt')
  }
}

/* Aufzählungspunkt im Teaser-Abschnitt. */
if (Array.isArray(home.teaser?.bullets)) {
  const neu = home.teaser.bullets.filter((z: any) => !treffer(z?.text))
  if (neu.length !== home.teaser.bullets.length) {
    homeDaten.teaser = { ...home.teaser, bullets: neu }
    geaendert.push('Startseite: Aufzählungspunkt im Teaser entfernt')
  }
}

if (treffer(home.seo?.description)) {
  homeDaten.seo = {
    ...home.seo,
    description: String(home.seo.description)
      .replace(/,?\s*5 Jahre deutsche Herstellergarantie/i, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+\./g, '.'),
  }
  geaendert.push('Startseite: Suchmaschinen-Beschreibung')
}

if (Object.keys(homeDaten).length > 0) {
  await payload.updateGlobal({ slug: 'home', data: homeDaten as never, overrideAccess: true })
}

/* --- Ankündigungsleiste ---------------------------------------------------- */
const einstellungen = (await payload.findGlobal({
  slug: 'site-settings',
  depth: 0,
  overrideAccess: true,
})) as Record<string, any>

const einstellungenDaten: Record<string, unknown> = {}

if (treffer(einstellungen.defaultSeoDescription)) {
  einstellungenDaten.defaultSeoDescription = String(einstellungen.defaultSeoDescription)
    .replace(/,?\s*mit fünf Jahren deutscher Herstellergarantie/i, '')
    .replace(/,?\s*5 Jahre deutsche Herstellergarantie/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .replace(/[—–-]\s*$/, '')
    .trim()
  geaendert.push('Einstellungen: Standard-Meta-Beschreibung')
}

if (treffer(einstellungen.announcement)) {
  const neu = String(einstellungen.announcement)
    .split('·')
    .map((teil) => teil.trim())
    .filter((teil) => !/arantie/.test(teil))
    .join(' · ')
  einstellungenDaten.announcement = neu
  geaendert.push(`Ankündigungsleiste: „${neu}"`)
}

if (Object.keys(einstellungenDaten).length > 0) {
  await payload.updateGlobal({ slug: 'site-settings', data: einstellungenDaten as never, overrideAccess: true })
}

/* --- Kategorien ------------------------------------------------------------ */
const kategorien = await payload.find({ collection: 'categories', limit: 100, depth: 0, overrideAccess: true })
for (const kategorie of kategorien.docs as Record<string, any>[]) {
  const daten: Record<string, unknown> = {}

  if (Array.isArray(kategorie.highlights)) {
    const index = kategorie.highlights.findIndex((h: any) => treffer(h?.title) || treffer(h?.text))
    if (index >= 0) {
      const neu = [...kategorie.highlights]
      neu[index] = { ...neu[index], title: KACHEL.title, text: KACHEL.text }
      daten.highlights = neu
      geaendert.push(`Kategorie „${kategorie.title}": Merkmal ersetzt`)
    }
  }

  if (Array.isArray(kategorie.faq)) {
    const neu = kategorie.faq.map((eintrag: any) =>
      treffer(eintrag?.answer)
        ? { ...eintrag, answer: String(eintrag.answer).replace(/\s*Wir geben fünf Jahre deutsche Herstellergarantie\./i, '') }
        : eintrag,
    )
    if (JSON.stringify(neu) !== JSON.stringify(kategorie.faq)) {
      daten.faq = neu
      geaendert.push(`Kategorie „${kategorie.title}": Antwort in den häufigen Fragen gekürzt`)
    }
  }

  if (Object.keys(daten).length > 0) {
    await payload.update({ collection: 'categories', id: kategorie.id, data: daten as never, overrideAccess: true })
  }
}

/* --- Produkte -------------------------------------------------------------- */
const produkte = await payload.find({ collection: 'products', limit: 200, depth: 0, overrideAccess: true })
let produktZaehler = 0
for (const produkt of produkte.docs as Record<string, any>[]) {
  const daten: Record<string, unknown> = {}

  if (Array.isArray(produkt.highlights)) {
    const neu = produkt.highlights.filter((h: any) => !treffer(h?.text) && !treffer(h?.title))
    if (neu.length !== produkt.highlights.length) daten.highlights = neu
  }

  if (Array.isArray(produkt.specs)) {
    const neu = produkt.specs.filter((z: any) => !treffer(z?.label) && !treffer(z?.value))
    if (neu.length !== produkt.specs.length) daten.specs = neu
  }

  /* Der Filter gehört auf den Baum, nicht auf die Hülle: `description` ist
     `{ root: … }`, und `root` trägt die Kinder. Beim ersten Versuch lief der
     Filter gegen die Hülle, fand dort kein `children` und gab alles unverändert
     zurück — der Listenpunkt blieb stehen, und der zweite Lauf meldete trotzdem
     „nichts zu tun". Aufgefallen ist das erst beim Nachzählen in der
     Testdatenbank. */
  if (produkt.description?.root) {
    const wurzel = nummerierungRichten(knotenOhneGarantie(produkt.description.root))
    if (JSON.stringify(wurzel) !== JSON.stringify(produkt.description.root)) {
      daten.description = { ...produkt.description, root: wurzel }
    }
  }

  if (Object.keys(daten).length > 0) {
    await payload.update({ collection: 'products', id: produkt.id, data: daten as never, overrideAccess: true })
    produktZaehler += 1
  }
}
if (produktZaehler > 0) geaendert.push(`Produkte: ${produktZaehler} Einträge bereinigt`)

/* --- AGB -------------------------------------------------------------------
   § 8 hieß „Gewährleistung und Garantie" und hatte drei Absätze. Absatz (2)
   sagte die Garantie zu, (3) nannte die Ausnahmen. Beide fallen weg, die
   Nummerierung des verbleibenden Absatzes entfällt damit ebenfalls. */
const seiten = await payload.find({ collection: 'pages', limit: 100, depth: 0, overrideAccess: true })
for (const seite of seiten.docs as Record<string, any>[]) {
  const wurzel = seite.content?.root
  if (!wurzel || !Array.isArray(wurzel.children)) continue
  if (!/arantie/.test(JSON.stringify(seite.content))) continue

  const kinder = [...wurzel.children]
  const kopf = kinder.findIndex((k: any) => k.type === 'heading' && knotenText(k).startsWith('§ 8'))
  if (kopf < 0) {
    payload.logger.warn(`Seite „${seite.title}" nennt die Garantie, aber ohne § 8 — bitte von Hand prüfen.`)
    continue
  }

  /* Überschrift umbenennen. */
  kinder[kopf] = {
    ...kinder[kopf],
    children: [{ ...kinder[kopf].children[0], text: '§ 8 Gewährleistung' }],
  }

  /* Absätze bis zur nächsten Überschrift durchgehen. */
  let i = kopf + 1
  const behalten: any[] = []
  while (i < kinder.length && kinder[i].type !== 'heading') {
    const text = knotenText(kinder[i])
    if (!/arantie/.test(text)) {
      behalten.push({
        ...kinder[i],
        children: kinder[i].children.map((kind: any) =>
          typeof kind.text === 'string' ? { ...kind, text: kind.text.replace(/^\(1\)\s*/, '') } : kind,
        ),
      })
    }
    i += 1
  }

  const neueKinder = [...kinder.slice(0, kopf + 1), ...behalten, ...kinder.slice(i)]
  await payload.update({
    collection: 'pages',
    id: seite.id,
    data: { content: { ...seite.content, root: { ...wurzel, children: neueKinder } } } as never,
    overrideAccess: true,
  })
  geaendert.push(`Seite „${seite.title}": § 8 auf die gesetzliche Gewährleistung gekürzt`)
}

if (geaendert.length === 0) {
  payload.logger.info('Nichts zu tun — die Garantie steht in keinem Inhalt mehr.')
} else {
  payload.logger.info('Geändert:')
  for (const zeile of geaendert) payload.logger.info('  - ' + zeile)
}
process.exit(0)
