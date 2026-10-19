/**
 * Ergänzt die sechs Ausführungen, die in der Händler-Preisliste 06/2026 stehen
 * und im Shop fehlten.
 *
 * Im Container ausführen — erst der Probelauf, der nichts verändert:
 *   node_modules/.bin/payload run src/scripts/preisliste-06-2026.ts
 *
 * Und wenn die Liste stimmt:
 *   PREISLISTE_AUSFUEHREN=1 node_modules/.bin/payload run src/scripts/preisliste-06-2026.ts
 *
 * VORHER EINE SICHERUNG ZIEHEN.
 *
 * Was dazukommt: die 4 und die 6 Ah im höheren Kunststoff-Gehäuse, die 55 Ah
 * in L3 und L5, die 118 Ah in L3 und L5.
 *
 * WOHER DIE INHALTE KOMMEN — das ist der Kern dieses Skripts:
 *
 *   Harte Werte (Artikelnummer, EAN, Preis, Maße, Gewicht, Balancer) stammen
 *   aus `src/seed/products.ts`, also aus der Preisliste.
 *
 *   Die Texte dagegen werden vom Geschwisterprodukt übernommen, das schon im
 *   Shop steht: Einleitung, Aufzählung, Ladegerät-Hinweis, Datenblatt-Zeilen,
 *   Kategorie, Verfügbarkeit, Versandhinweis und das Produktfoto. Der Grund:
 *   Bulltron hat diese Texte seit dem Aufbau im Backend überarbeitet — die
 *   4 Ah wiegt dort 450 statt 500 Gramm, der Ladegerät-Hinweis ist ein ganz
 *   anderer, bei der Herkunft steht „(Deutschland)" dahinter. Würde das
 *   Skript die Seed-Texte nehmen, stünden neben den gepflegten Produkten
 *   plötzlich welche mit dem alten Stand.
 *
 *   Ersetzt werden nur die Stellen, die sich zwischen den Bauformen
 *   unterscheiden: die erste Zeile der Einleitung sowie die ersten beiden
 *   Punkte der Aufzählung und der Merkmale. Die stehen unten je Produkt
 *   ausgeschrieben, damit nachlesbar ist, was das Skript hineinschreibt.
 *
 * KEIN PRODUKTFOTO FÜR DIE 118 AH: Auf dem Etikett jeder Batterie steht die
 * Kapazität. Ein Foto der 55 Ah wäre dort nachweislich falsch. Die
 * Produktseite schreibt stattdessen „Kein Produktbild hinterlegt", bis
 * Bulltron ein Foto liefert.
 *
 * MEHRFACH AUSFÜHRBAR: Was es schon gibt — geprüft über die Artikelnummer —
 * bleibt unberührt.
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { seedProducts } from '../seed/products'

const AUSFUEHREN = ['1', 'true', 'ja'].includes(String(process.env.PREISLISTE_AUSFUEHREN ?? '').toLowerCase())

type Neuzugang = {
  sku: string
  /** Von diesem Produkt werden Texte, Kategorie, Foto und Versandangaben übernommen. */
  vorlageSku: string
  /** Bruttogewicht inklusive Verpackung aus der Preisliste 06/2026. */
  versandgewicht: number
  /** Ersetzt die Einleitung der Vorlage. */
  einleitung: string
  /** Ersetzt die ersten beiden Punkte der Aufzählung im Fließtext. */
  punkte: [string, string]
  /** Ersetzt die ersten beiden Merkmale über dem Datenblatt. */
  merkmale: [string, string]
  /** Ohne Foto anlegen (nur die 118 Ah). */
  ohneFoto?: boolean
}

const NEU: Neuzugang[] = [
  {
    sku: 'LI4B500-12-R2',
    vorlageSku: 'LI4B500-12-R1',
    /* Die Liste führt für die kleinen Kunststoff-Gehäuse keine eigene
       Brutto-Spalte; 0,6 kg ist der dort genannte Wert. */
    versandgewicht: 0.6,
    einleitung:
      'Die Race 4 Ah im höheren Gehäuse: 105 statt 82 Millimeter, Grundfläche und Technik unverändert. 4 Ah Kapazität, 500 Ampere Kaltstartstrom.',
    punkte: ['500 A Kaltstartstrom bei 113 x 70 x 105 mm Gehäusemaß', 'Bauhöhe 105 mm'],
    merkmale: ['500 A Kaltstartstrom', 'Bauhöhe 105 mm'],
  },
  {
    sku: 'LI6B650-12-R2',
    vorlageSku: 'LI6B650-12-R1',
    versandgewicht: 0.8,
    einleitung:
      'Die Race 6 Ah im höheren Gehäuse: 105 statt 93 Millimeter, Grundfläche und Technik unverändert. 6 Ah Kapazität, 650 Ampere Kaltstartstrom.',
    punkte: ['650 A Kaltstartstrom bei 150 x 87 x 105 mm Gehäusemaß', 'Bauhöhe 105 mm'],
    merkmale: ['650 A Kaltstartstrom', 'Bauhöhe 105 mm'],
  },
  {
    sku: 'LI55B1400-12-RL3',
    vorlageSku: 'LI55B1400-12-RL2',
    versandgewicht: 7.5,
    einleitung:
      'Die 55 Ah im L3-Maß: 279 Millimeter lang. Technisch identisch zur L1- und L2-Ausführung, für Batteriefächer mit dem längeren Normmaß.',
    punkte: ['1400 A Kaltstartstrom bei 279 x 175 x 189 mm (L3)', '6,5 kg Gewicht, aktiver Balancer mit 5 A'],
    merkmale: ['1400 A Kaltstartstrom', 'L3-Gehäuse, 6,5 kg'],
  },
  {
    sku: 'LI55B1400-12-RL5',
    vorlageSku: 'LI55B1400-12-RL2',
    versandgewicht: 7.8,
    einleitung:
      'Die längste Ausführung der 55 Ah: L5-Maß mit 355 Millimetern. Elektrisch identisch zu L1, L2 und L3, nur das Gehäuse ist anders.',
    punkte: ['1400 A Kaltstartstrom bei 355 x 175 x 189 mm (L5)', '6,8 kg Gewicht, aktiver Balancer mit 5 A'],
    merkmale: ['1400 A Kaltstartstrom', 'L5-Gehäuse, 6,8 kg'],
  },
  {
    sku: 'LI118B2000-12-RL3',
    vorlageSku: 'LI55B1400-12-RL2',
    versandgewicht: 10.2,
    ohneFoto: true,
    einleitung:
      'Die 118 Ah ist die größte Batterie der Baureihe: 2000 Ampere Kaltstartstrom und 118 Amperestunden Kapazität im genormten L3-Gehäuse.',
    punkte: ['2000 A Kaltstartstrom bei 279 x 175 x 189 mm (L3)', '9,2 kg Gewicht, aktiver Balancer mit 5 A'],
    merkmale: ['2000 A Kaltstartstrom', 'L3-Gehäuse, 9,2 kg'],
  },
  {
    sku: 'LI118B2000-12-RL5',
    vorlageSku: 'LI55B1400-12-RL2',
    versandgewicht: 10.9,
    ohneFoto: true,
    einleitung:
      'Die längste Ausführung der 118 Ah: L5-Maß mit 355 Millimetern. Elektrisch identisch zur L3, nur das Gehäuse ist anders.',
    punkte: ['2000 A Kaltstartstrom bei 355 x 175 x 189 mm (L5)', '9,9 kg Gewicht, aktiver Balancer mit 5 A'],
    merkmale: ['2000 A Kaltstartstrom', 'L5-Gehäuse, 9,9 kg'],
  },
]

/** Baureihe und Bauform, die bei den vorhandenen 4 und 6 Ah fehlen. */
const NACHTRAGEN: { sku: string; baureihe: string; bauform: string }[] = [
  { sku: 'LI4B500-12-R1', baureihe: 'Race 4 Ah', bauform: 'Bauhöhe 82 mm' },
  { sku: 'LI6B650-12-R1', baureihe: 'Race 6 Ah', bauform: 'Bauhöhe 93 mm' },
]

const payload = await getPayload({ config })

const holen = async (sku: string): Promise<Record<string, any> | undefined> => {
  const treffer = await payload.find({
    collection: 'products',
    where: { sku: { equals: sku } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return treffer.docs[0] as Record<string, any> | undefined
}

/** Einen Textknoten mit dem Aufbau erzeugen, den Payload-Lexical erwartet. */
const textKnoten = (wert: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: wert,
  version: 1,
})

/**
 * Die Beschreibung der Vorlage übernehmen und nur die Stellen austauschen, die
 * sich zwischen den Bauformen unterscheiden.
 *
 * Angefasst werden genau zwei Dinge: der erste Absatz und die ersten beiden
 * Einträge der ersten Liste. Alles andere — Überschrift, die allgemeinen
 * Aussagen, der Ladegerät-Hinweis am Ende — bleibt Zeichen für Zeichen so,
 * wie es im Backend steht.
 */
const beschreibungAbwandeln = (
  vorlage: unknown,
  einleitung: string,
  punkte: [string, string],
): { inhalt: unknown; ersetzt: string[]; behalten: string[] } => {
  const kopie = JSON.parse(JSON.stringify(vorlage ?? {})) as Record<string, any>
  const kinder: Record<string, any>[] = kopie?.root?.children ?? []
  const ersetzt: string[] = []
  const behalten: string[] = []

  const ersterAbsatz = kinder.find((k) => k?.type === 'paragraph')
  if (ersterAbsatz) {
    const vorher = (ersterAbsatz.children ?? []).map((c: any) => c?.text ?? '').join('')
    ersterAbsatz.children = [textKnoten(einleitung)]
    ersetzt.push(`Einleitung: „${vorher.slice(0, 60)}…" → „${einleitung.slice(0, 60)}…"`)
  }

  const liste = kinder.find((k) => k?.type === 'list')
  const eintraege: Record<string, any>[] = liste?.children ?? []
  eintraege.forEach((eintrag, i) => {
    const vorher = (eintrag.children ?? []).map((c: any) => c?.text ?? '').join('')
    if (i < punkte.length) {
      eintrag.children = [textKnoten(punkte[i])]
      ersetzt.push(`Punkt ${i + 1}: „${vorher}" → „${punkte[i]}"`)
    } else {
      behalten.push(vorher)
    }
  })

  const hinweise = kinder.filter((k) => k?.type === 'paragraph').slice(1)
  for (const h of hinweise) behalten.push((h.children ?? []).map((c: any) => c?.text ?? '').join(''))

  return { inhalt: kopie, ersetzt, behalten }
}

/* ------------------------------------------------------------------ Lauf -- */

if (!AUSFUEHREN) {
  payload.logger.info('PROBELAUF — es wird nichts angelegt. Zum Ausführen PREISLISTE_AUSFUEHREN=1 setzen.')
} else {
  payload.logger.info('Es wird angelegt.')
}

/* Einsortieren: Die neuen Bauformen sollen neben ihren Geschwistern stehen,
   nicht hinten dran. Die Reihenfolge steckt in src/seed/products.ts — dort
   stehen jetzt alle fünfzehn in der gewünschten Abfolge. */
const reihenfolge = new Map(seedProducts.map((p, i) => [p.sku, i + 1]))

let angelegt = 0
let vorhanden = 0
let fehler = 0

for (const neu of NEU) {
  const daten = seedProducts.find((p) => p.sku === neu.sku)
  if (!daten) {
    payload.logger.error(`${neu.sku}: steht nicht in src/seed/products.ts — abgebrochen.`)
    fehler++
    continue
  }

  const schonDa = await holen(neu.sku)
  if (schonDa) {
    payload.logger.info(`${neu.sku} ist schon angelegt (${schonDa.title}) — übersprungen.`)
    vorhanden++
    continue
  }

  const vorlage = await holen(neu.vorlageSku)
  if (!vorlage) {
    payload.logger.error(`${neu.sku}: Vorlage ${neu.vorlageSku} nicht gefunden — übersprungen.`)
    fehler++
    continue
  }

  /* Datenblatt: Zeilen der Vorlage übernehmen und nur die Werte überschreiben,
     die wirklich aus der Preisliste kommen. Die markenweiten Zeilen —
     Nennspannung, Zellchemie, Lade- und Entladetemperatur, Herkunft — bleiben
     unangetastet, weil Bulltron sie im Backend gepflegt hat: Bei der Herkunft
     steht dort inzwischen „(Deutschland)" dahinter, und das soll bei den neuen
     Ausführungen genauso stehen.

     Zeilen, für die die Liste nichts hergibt — das Gewicht der beiden
     Kunststoff-Ausführungen — fallen heraus statt falsch dazustehen. */
  const AUS_PREISLISTE = new Set([
    'Kapazität',
    'Kaltstartstrom',
    'Gewicht',
    'Gehäuse',
    'Aktiver Balancer',
    'Artikelnummer',
    'EAN',
  ])
  /* „Abmessung" über den Anfang geprüft, damit der Zusatz „(L x B x H)" im
     Backend frei änderbar bleibt — so macht es auch lib/varianten.ts. */
  const ausPreisliste = (label: string) => AUS_PREISLISTE.has(label) || label.trim().startsWith('Abmessung')

  const ausListe = new Map(daten.specs.map(([label, wert]) => [label, wert]))
  const spezifikationen = (vorlage.specs ?? [])
    .map((zeile: any) => {
      const label = String(zeile?.label ?? '')
      if (ausPreisliste(label) && ausListe.has(label)) return { label, value: ausListe.get(label) as string }
      return { label, value: String(zeile?.value ?? '') }
    })
    .filter((zeile: { label: string; value: string }) => {
      if (zeile.label !== 'Gewicht') return true
      return Boolean(daten.keyData.weight)
    })

  const merkmale = (vorlage.highlights ?? []).map((h: any, i: number) =>
    i < neu.merkmale.length ? { text: neu.merkmale[i] } : { text: String(h?.text ?? '') },
  )

  const { inhalt, ersetzt, behalten } = beschreibungAbwandeln(vorlage.description, neu.einleitung, neu.punkte)

  const satz: Record<string, unknown> = {
    title: daten.title,
    slug: daten.slug,
    status: vorlage.status ?? 'published',
    category: vorlage.category,
    variantGroup: daten.variantGroup,
    variantLabel: daten.variantLabel,
    sortOrder: reihenfolge.get(neu.sku) ?? 99,
    featured: false,
    subtitle: daten.subtitle,
    shortDescription: daten.shortDescription,
    keyData: daten.keyData,
    highlights: merkmale,
    price: daten.price,
    sku: daten.sku,
    ean: daten.ean,
    availability: vorlage.availability,
    deliveryTime: vorlage.deliveryTime,
    shippingWeight: neu.versandgewicht,
    shippingNote: vorlage.shippingNote,
    mainImage: neu.ohneFoto ? undefined : vorlage.mainImage,
    video: { title: vorlage.video?.title ?? 'Das Produkt im Einsatz' },
    description: inhalt,
    specs: spezifikationen,
    downloads: (vorlage.downloads ?? []).map((d: any) => ({
      label: String(d?.label ?? '').replace(vorlage.title, daten.title),
      url: String(d?.url ?? '#'),
    })),
    seo: {
      title: `${daten.title} — ${daten.subtitle}`,
      description: daten.shortDescription.slice(0, 175),
    },
  }

  payload.logger.info('')
  payload.logger.info(`${daten.title} (${neu.sku}) — Vorlage: ${vorlage.title}`)
  payload.logger.info(`  Adresse: /produkte/${daten.slug}`)
  payload.logger.info(`  Preis ${daten.price} €, EAN ${daten.ean}, Versandgewicht ${neu.versandgewicht} kg`)
  payload.logger.info(`  Baureihe: ${daten.variantGroup} / ${daten.variantLabel}, Platz ${satz.sortOrder}`)
  payload.logger.info(`  Foto: ${neu.ohneFoto ? 'keines (Etikett zeigt die Kapazität)' : `übernommen von ${vorlage.title}`}`)
  for (const z of ersetzt) payload.logger.info('  Ersetzt — ' + z)
  for (const z of behalten) payload.logger.info('  Übernommen — ' + z.slice(0, 90))
  payload.logger.info(`  Datenblatt: ${spezifikationen.length} Zeilen, Merkmale: ${merkmale.length}`)

  if (!AUSFUEHREN) continue

  try {
    await payload.create({ collection: 'products', data: satz as never, overrideAccess: true })
    angelegt++
    payload.logger.info('  ANGELEGT')
  } catch (e) {
    fehler++
    payload.logger.error(`  FEHLER: ${e instanceof Error ? e.message : 'unbekannt'}`)
  }
}

/* Die vorhandenen 4 und 6 Ah brauchen jetzt eine Baureihe, sonst zeigt die
   Produktseite keine Auswahl zwischen den beiden Bauhöhen. Wie in
   bauform-varianten.ts: Steht dort schon etwas, bleibt es stehen. */
payload.logger.info('')
for (const { sku, baureihe, bauform } of NACHTRAGEN) {
  const produkt = await holen(sku)
  if (!produkt) {
    payload.logger.error(`${sku} nicht gefunden — Baureihe nicht nachgetragen.`)
    fehler++
    continue
  }
  const gefuellt = (w: unknown) => typeof w === 'string' && w.trim().length > 0
  if (gefuellt(produkt.variantGroup) || gefuellt(produkt.variantLabel)) {
    payload.logger.info(
      `${produkt.title} (${sku}): Baureihe steht schon auf „${produkt.variantGroup ?? ''}" / „${produkt.variantLabel ?? ''}" — unberührt.`,
    )
    continue
  }
  payload.logger.info(`${produkt.title} (${sku}) → Baureihe ${baureihe}, Bauform ${bauform}`)
  if (!AUSFUEHREN) continue
  await payload.update({
    collection: 'products',
    id: produkt.id,
    data: { variantGroup: baureihe, variantLabel: bauform } as never,
    overrideAccess: true,
  })
}

/* Zum Schluss nachzählen, was im Shop steht, und die Baureihen prüfen: Eine
   Baureihe mit nur einem Mitglied zeigt keine Auswahl — bei der 118 Ah wäre
   das ein Zeichen, dass eine der beiden Bauformen nicht angelegt wurde. */
payload.logger.info('')
const alle = await payload.find({
  collection: 'products',
  limit: 200,
  depth: 0,
  overrideAccess: true,
  sort: 'sortOrder',
})
payload.logger.info(`Produkte im Bestand: ${alle.totalDocs}`)
const gruppen = new Map<string, string[]>()
for (const p of alle.docs as Record<string, any>[]) {
  payload.logger.info(
    `  ${String(p.sortOrder ?? '?').padStart(3)}  ${String(p.sku ?? '—').padEnd(20)} ${p.title}  [${p.status}]${p.mainImage ? '' : '  OHNE FOTO'}`,
  )
  const schluessel =
    typeof p.variantGroup === 'string' ? p.variantGroup.trim().replace(/\s+/g, ' ').toLowerCase() : ''
  if (!schluessel) continue
  gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), p.variantLabel || p.title])
}
payload.logger.info('')
for (const [schluessel, mitglieder] of gruppen) {
  const zeile = `  ${schluessel}: ${mitglieder.length} Bauformen (${mitglieder.join(', ')})`
  if (mitglieder.length < 2) payload.logger.warn(zeile + ' — allein, zeigt keine Auswahl')
  else payload.logger.info(zeile)
}

payload.logger.info('')
if (AUSFUEHREN) {
  payload.logger.info(`Angelegt: ${angelegt}, schon vorhanden: ${vorhanden}, Fehler: ${fehler}`)
} else {
  payload.logger.info(`Probelauf beendet. ${NEU.length - vorhanden - fehler} würden angelegt, ${vorhanden} gibt es schon.`)
}

process.exit(fehler > 0 ? 1 : 0)
