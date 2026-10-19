import { doc, h, p, ul } from './lexical'

/**
 * Produktdaten aus den Händler-Preislisten von Bulltron.
 *
 * Grundlage der neun ursprünglichen Ausführungen ist die Liste 08/2026 (Neue
 * Modelle). Am 19.10.2026 sind sechs weitere Ausführungen aus der Liste
 * 06/2026 (Neue Modelle) dazugekommen: die beiden höheren Kunststoff-Gehäuse
 * der 4 und 6 Ah, die 55 Ah in L3 und L5 und die 118 Ah in L3 und L5.
 *
 * ACHTUNG, die beiden Listen widersprechen sich an zwei Stellen:
 *   - Die 118 Ah stand nicht in der Liste 08/2026 und war deshalb von der
 *     Website genommen. Marco hat die Aufnahme am 19.10.2026 entschieden.
 *   - Die Gewichte der 4, 6 und 12 Ah: 08/2026 nennt 0,5 / 0,7 / 1,3 kg,
 *     06/2026 nennt 0,6 / 0,8 / 1,5 kg. Hier stehen weiter die Werte aus
 *     08/2026. Bei den beiden neuen Kunststoff-Ausführungen bleibt das
 *     Gewicht deshalb leer, bis Bulltron den Widerspruch geklärt hat —
 *     lieber keine Angabe als die falsche.
 *
 * Alle Werte — Artikelnummer, EAN, Kaltstartstrom, Maße, Gewicht, Balancer und
 * UVP — stammen aus diesen Listen. Nichts davon ist geschätzt oder ergänzt.
 * Die Preise sind die Brutto-UVP; die Händler-Einkaufspreise aus der Liste
 * gehören nicht auf die Website und stehen deshalb nirgends im Projekt.
 *
 * Die gesamte Baureihe ist 12,8 V LiFePO4. Die frühere Trennung in „12 V" und
 * „12,8 V LiFePO4" gab es nie — sie war ein Missverständnis aus dem alten
 * Auftritt.
 */

export type SeedProduct = {
  slug: string
  title: string
  subtitle: string
  categorySlug: 'motorsportbatterien' | 'rennsportbatterien' | 'motorradbatterien'
  /* Bauform-Varianten: gleiche Baureihe = gleiche Elektrik, anderes Gehäuse.
     Leer bei Batterien, die es nur in einer Bauform gibt. */
  variantGroup?: string
  variantLabel?: string
  price: number
  sku: string
  ean: string
  /* Optional: Für die 118 Ah liegt kein Produktfoto vor. Ein Foto einer
     anderen Ausführung wäre hier falsch — auf dem Etikett steht die
     Kapazität. Die Produktseite schreibt dann „Kein Produktbild hinterlegt". */
  image?: string
  badge?: string
  featured?: boolean
  shortDescription: string
  keyData: { voltage: string; capacity: string; current: string; weight: string }
  highlights: string[]
  specs: [string, string][]
  description: ReturnType<typeof doc>
  video?: { url: string; title: string; description: string }
}

/**
 * Die Aussagen, die auf dem bisherigen Auftritt bei jedem Produkt standen.
 * Nur diese sind belegt — alles darüber hinaus wäre erfunden.
 */
const belegteAussagen = [
  'Effizientes Laden bis −20 °C, Entladen bis −30 °C',
  'Bis 75 % höhere Zyklenlebensdauer als andere LiFePO4-Batterien',
  'Bis 45 % kleiner und bis 35 % leichter als andere LiFePO4-Batterien',
  'Bleibatterie-Ersatz mit bis zu 10-facher Lebensdauer',
  'Extrem hoher Startstrom bei sehr geringem Gewicht',
]

const body = (intro: string, punkte: string[]) =>
  doc([
    p(intro),
    h('h3', 'Was diese Batterie auszeichnet'),
    ul(punkte),
    p(
      'Hinweis: Zum Laden genügt ein handelsübliches Ladegerät, ein besonderes Lithium-Ladegerät ist nicht erforderlich. Bei Fragen zum passenden Gerät sprich uns an — wir sagen dir, was zu deinem Fahrzeug passt.',
    ),
  ])

/** Technische Daten, die bei jeder Batterie der Baureihe gleich sind. */
const gemeinsameDaten = (balancer: string): [string, string][] => [
  ['Nennspannung', '12,8 V (für 12-V-Bordnetze)'],
  ['Zellchemie', 'LiFePO4'],
  ['Aktiver Balancer', balancer],
  ['Ladetemperatur', 'bis −20 °C'],
  ['Entladetemperatur', 'bis −30 °C'],
  ['Herkunft', 'Entwickelt und konfektioniert in Lüneburg'],
]

export const seedProducts: SeedProduct[] = [
  {
    slug: 'bulltron-race-4ah-12v',
    title: 'Race 4 Ah',
    subtitle: '12,8 V LiFePO4 Starterbatterie',
    categorySlug: 'motorradbatterien',
    variantGroup: 'Race 4 Ah',
    variantLabel: 'Bauhöhe 82 mm',
    price: 199,
    sku: 'LI4B500-12-R1',
    ean: '4262358250810',
    image: 'race-4ah.webp',
    badge: 'Leichtgewicht',
    shortDescription:
      'Die kleinste Batterie der Baureihe: 500 A Kaltstartstrom bei 500 Gramm, im Kunststoff-Gehäuse.',
    keyData: { voltage: '12,8 V', capacity: '4 Ah', current: '500 A', weight: '0,5 kg' },
    highlights: ['500 A Kaltstartstrom', 'Nur 500 Gramm', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '4 Ah'],
      ['Kaltstartstrom', '500 A'],
      ['Gewicht', '0,5 kg'],
      ['Abmessung (L x B x H)', '113 x 70 x 82 mm'],
      ['Gehäuse', 'Kunststoff'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI4B500-12-R1'],
      ['EAN', '4262358250810'],
    ],
    description: body(
      'Die Race 4 Ah ist die kleinste Batterie der Baureihe. Sie ersetzt eine konventionelle Bleibatterie im Motorrad und spart dabei den Großteil des Gewichts — bei 500 Ampere Kaltstartstrom.',
      ['500 A Kaltstartstrom bei 113 x 70 x 82 mm Gehäusemaß', 'Nur 500 Gramm Gewicht', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-4ah-105mm',
    title: 'Race 4 Ah 105 mm',
    subtitle: '12,8 V LiFePO4 Starterbatterie',
    categorySlug: 'motorradbatterien',
    variantGroup: 'Race 4 Ah',
    variantLabel: 'Bauhöhe 105 mm',
    price: 199,
    sku: 'LI4B500-12-R2',
    ean: '4262358250827',
    /* Dasselbe Foto wie die niedrige Ausführung: Es zeigt dieselbe Batterie,
       und das Etikett darauf — 4Ah, CCA 500A, 12V — stimmt für beide. */
    image: 'race-4ah.webp',
    shortDescription:
      'Dieselbe Technik wie die Race 4 Ah, im 105 Millimeter hohen Kunststoff-Gehäuse.',
    /* Gewicht bleibt leer: siehe Kopfkommentar, die beiden Listen nennen
       unterschiedliche Werte und für diese Ausführung gibt es nur einen. */
    keyData: { voltage: '12,8 V', capacity: '4 Ah', current: '500 A', weight: '' },
    highlights: ['500 A Kaltstartstrom', 'Bauhöhe 105 mm', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '4 Ah'],
      ['Kaltstartstrom', '500 A'],
      ['Abmessung (L x B x H)', '113 x 70 x 105 mm'],
      ['Gehäuse', 'Kunststoff'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI4B500-12-R2'],
      ['EAN', '4262358250827'],
    ],
    description: body(
      'Die Race 4 Ah im höheren Gehäuse: 105 statt 82 Millimeter, Grundfläche und Technik unverändert. 4 Ah Kapazität, 500 Ampere Kaltstartstrom.',
      ['500 A Kaltstartstrom bei 113 x 70 x 105 mm Gehäusemaß', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-6ah-12v',
    title: 'Race 6 Ah',
    subtitle: '12,8 V LiFePO4 Starterbatterie',
    categorySlug: 'motorradbatterien',
    variantGroup: 'Race 6 Ah',
    variantLabel: 'Bauhöhe 93 mm',
    price: 249,
    sku: 'LI6B650-12-R1',
    ean: '4262358250834',
    image: 'race-6ah.webp',
    shortDescription:
      'Mehr Kapazität als die 4 Ah bei 700 Gramm Gewicht. 650 A Kaltstartstrom im Kunststoff-Gehäuse.',
    keyData: { voltage: '12,8 V', capacity: '6 Ah', current: '650 A', weight: '0,7 kg' },
    highlights: ['650 A Kaltstartstrom', '700 Gramm Gewicht', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '6 Ah'],
      ['Kaltstartstrom', '650 A'],
      ['Gewicht', '0,7 kg'],
      ['Abmessung (L x B x H)', '150 x 87 x 93 mm'],
      ['Gehäuse', 'Kunststoff'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI6B650-12-R1'],
      ['EAN', '4262358250834'],
    ],
    description: body(
      'Die Race 6 Ah liegt zwischen der 4 Ah und der 12 Ah: mehr Kapazität für Motorräder mit Zusatzverbrauchern, ohne das Gewicht einer Bleibatterie.',
      ['650 A Kaltstartstrom bei 150 x 87 x 93 mm Gehäusemaß', '700 Gramm Gewicht', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-6ah-105mm',
    title: 'Race 6 Ah 105 mm',
    subtitle: '12,8 V LiFePO4 Starterbatterie',
    categorySlug: 'motorradbatterien',
    variantGroup: 'Race 6 Ah',
    variantLabel: 'Bauhöhe 105 mm',
    price: 249,
    sku: 'LI6B650-12-R2',
    ean: '4262358250841',
    image: 'race-6ah.webp',
    shortDescription:
      'Dieselbe Technik wie die Race 6 Ah, im 105 Millimeter hohen Kunststoff-Gehäuse.',
    keyData: { voltage: '12,8 V', capacity: '6 Ah', current: '650 A', weight: '' },
    highlights: ['650 A Kaltstartstrom', 'Bauhöhe 105 mm', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '6 Ah'],
      ['Kaltstartstrom', '650 A'],
      ['Abmessung (L x B x H)', '150 x 87 x 105 mm'],
      ['Gehäuse', 'Kunststoff'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI6B650-12-R2'],
      ['EAN', '4262358250841'],
    ],
    description: body(
      'Die Race 6 Ah im höheren Gehäuse: 105 statt 93 Millimeter, Grundfläche und Technik unverändert. 6 Ah Kapazität, 650 Ampere Kaltstartstrom.',
      ['650 A Kaltstartstrom bei 150 x 87 x 105 mm Gehäusemaß', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-12ah-12v',
    title: 'Race 12 Ah',
    subtitle: '12,8 V LiFePO4 Starterbatterie',
    categorySlug: 'motorradbatterien',
    price: 399,
    sku: 'LI12B1000-12-R',
    ean: '4262358250858',
    image: 'race-12ah.webp',
    featured: true,
    shortDescription:
      '1000 A Kaltstartstrom bei 1,3 Kilogramm — die stärkste Batterie im Kunststoff-Gehäuse.',
    keyData: { voltage: '12,8 V', capacity: '12 Ah', current: '1000 A', weight: '1,3 kg' },
    highlights: ['1000 A Kaltstartstrom', 'Nur 1,3 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '12 Ah'],
      ['Kaltstartstrom', '1000 A'],
      ['Gewicht', '1,3 kg'],
      ['Abmessung (L x B x H)', '150 x 87 x 132 mm'],
      ['Gehäuse', 'Kunststoff'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI12B1000-12-R'],
      ['EAN', '4262358250858'],
    ],
    description: body(
      'Die Race 12 Ah liefert 1000 Ampere Kaltstartstrom und bleibt dabei unter anderthalb Kilogramm. Sie ist die stärkste Batterie der Baureihe im Kunststoff-Gehäuse.',
      ['1000 A Kaltstartstrom bei 150 x 87 x 132 mm Gehäusemaß', '1,3 kg Gewicht', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-27ah-12v',
    title: 'Race 27 Ah Metall',
    subtitle: '12,8 V LiFePO4 Starterbatterie im Metall-Gehäuse',
    categorySlug: 'motorsportbatterien',
    variantGroup: 'Race 27 Ah',
    variantLabel: 'Metall',
    price: 499,
    sku: 'LI27B700-12-RM',
    ean: '4262358250780',
    image: 'batterie-27ah.png',
    badge: 'Metall-Gehäuse',
    featured: true,
    shortDescription:
      '27 Ah mit 700 A Kaltstartstrom im Metall-Gehäuse — kompakter und leichter als die Ausführungen im L-Gehäuse.',
    keyData: { voltage: '12,8 V', capacity: '27 Ah', current: '700 A', weight: '3,0 kg' },
    highlights: ['700 A Kaltstartstrom', 'Metall-Gehäuse, 3,0 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '27 Ah'],
      ['Kaltstartstrom', '700 A'],
      ['Gewicht', '3,0 kg'],
      ['Abmessung (L x B x H)', '175 x 125 x 129 mm'],
      ['Gehäuse', 'Metall'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI27B700-12-RM'],
      ['EAN', '4262358250780'],
    ],
    description: body(
      'Die 27 Ah im Metall-Gehäuse ist die kompakteste Ausführung dieser Kapazität: 175 x 125 x 129 mm bei 3,0 Kilogramm. Für Fahrzeuge, in denen der Platz knapp ist.',
      ['700 A Kaltstartstrom bei 175 x 125 x 129 mm Gehäusemaß', 'Metall-Gehäuse, 3,0 kg Gewicht', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-27ah-lifepo4',
    title: 'Race 27 Ah L1',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L1-Gehäuse',
    categorySlug: 'motorsportbatterien',
    variantGroup: 'Race 27 Ah',
    variantLabel: 'L1',
    price: 399,
    sku: 'LI27B700-12-RL1',
    ean: '4262358250759',
    image: 'race-27ah-l1.webp',
    shortDescription:
      '27 Ah mit 700 A Kaltstartstrom im genormten L1-Gehäuse — passt in das Batteriefach vieler Fahrzeuge ohne Umbau.',
    keyData: { voltage: '12,8 V', capacity: '27 Ah', current: '700 A', weight: '3,5 kg' },
    highlights: ['700 A Kaltstartstrom', 'L1-Gehäuse, 3,5 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '27 Ah'],
      ['Kaltstartstrom', '700 A'],
      ['Gewicht', '3,5 kg'],
      ['Abmessung (L x B x H)', '207 x 175 x 189 mm'],
      ['Gehäuse', 'L1'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI27B700-12-RL1'],
      ['EAN', '4262358250759'],
    ],
    description: body(
      'Dieselbe Technik wie die 27 Ah im Metall-Gehäuse, aber im genormten L1-Maß. Damit passt sie in das vorhandene Batteriefach, ohne dass die Halterung geändert werden muss.',
      ['700 A Kaltstartstrom bei 207 x 175 x 189 mm (L1)', '3,5 kg Gewicht', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-27ah-l2',
    title: 'Race 27 Ah L2',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L2-Gehäuse',
    categorySlug: 'motorsportbatterien',
    variantGroup: 'Race 27 Ah',
    variantLabel: 'L2',
    price: 399,
    sku: 'LI27B700-12-RL2',
    ean: '4262358250766',
    image: 'race-27ah-l2.webp',
    shortDescription:
      '27 Ah mit 700 A Kaltstartstrom im genormten L2-Gehäuse, 244 mm lang.',
    keyData: { voltage: '12,8 V', capacity: '27 Ah', current: '700 A', weight: '3,5 kg' },
    highlights: ['700 A Kaltstartstrom', 'L2-Gehäuse, 3,5 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '27 Ah'],
      ['Kaltstartstrom', '700 A'],
      ['Gewicht', '3,5 kg'],
      ['Abmessung (L x B x H)', '244 x 175 x 189 mm'],
      ['Gehäuse', 'L2'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI27B700-12-RL2'],
      ['EAN', '4262358250766'],
    ],
    description: body(
      'Die 27 Ah im L2-Maß: 244 Millimeter lang statt 207. Für Fahrzeuge, deren Batteriefach auf das längere Normmaß ausgelegt ist.',
      ['700 A Kaltstartstrom bei 244 x 175 x 189 mm (L2)', '3,5 kg Gewicht', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-27ah-l3',
    title: 'Race 27 Ah L3',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L3-Gehäuse',
    categorySlug: 'motorsportbatterien',
    variantGroup: 'Race 27 Ah',
    variantLabel: 'L3',
    price: 399,
    sku: 'LI27B700-12-RL3',
    ean: '4262358250773',
    image: 'race-27ah-l3.webp',
    shortDescription:
      '27 Ah mit 700 A Kaltstartstrom im genormten L3-Gehäuse, 279 mm lang.',
    keyData: { voltage: '12,8 V', capacity: '27 Ah', current: '700 A', weight: '3,5 kg' },
    highlights: ['700 A Kaltstartstrom', 'L3-Gehäuse, 3,5 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '27 Ah'],
      ['Kaltstartstrom', '700 A'],
      ['Gewicht', '3,5 kg'],
      ['Abmessung (L x B x H)', '279 x 175 x 189 mm'],
      ['Gehäuse', 'L3'],
      ...gemeinsameDaten('1 A'),
      ['Artikelnummer', 'LI27B700-12-RL3'],
      ['EAN', '4262358250773'],
    ],
    description: body(
      'Die längste Ausführung der 27 Ah: L3-Maß mit 279 Millimetern. Technisch identisch zu L1 und L2, nur das Gehäuse ist anders.',
      ['700 A Kaltstartstrom bei 279 x 175 x 189 mm (L3)', '3,5 kg Gewicht', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-55ah-12v',
    title: 'Race 55 Ah L1',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L1-Gehäuse',
    categorySlug: 'rennsportbatterien',
    variantGroup: 'Race 55 Ah',
    variantLabel: 'L1',
    price: 599,
    sku: 'LI55B1400-12-RL1',
    ean: '4262358250742',
    image: 'race-55ah-l1.webp',
    featured: true,
    shortDescription:
      'Die stärkste Batterie der Baureihe: 1400 A Kaltstartstrom und 55 Ah Kapazität im L1-Gehäuse.',
    keyData: { voltage: '12,8 V', capacity: '55 Ah', current: '1400 A', weight: '6,5 kg' },
    highlights: ['1400 A Kaltstartstrom', '55 Ah Kapazität', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '55 Ah'],
      ['Kaltstartstrom', '1400 A'],
      ['Gewicht', '6,5 kg'],
      ['Abmessung (L x B x H)', '207 x 175 x 189 mm'],
      ['Gehäuse', 'L1'],
      ...gemeinsameDaten('5 A'),
      ['Artikelnummer', 'LI55B1400-12-RL1'],
      ['EAN', '4262358250742'],
    ],
    description: body(
      'Mit 1400 Ampere Kaltstartstrom ist die 55 Ah die stärkste Batterie der Baureihe. Die 55 Ah Kapazität versorgen zusätzlich das Bordnetz über eine ganze Veranstaltung.',
      ['1400 A Kaltstartstrom bei 207 x 175 x 189 mm (L1)', '6,5 kg Gewicht, aktiver Balancer mit 5 A', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-55ah-lifepo4',
    title: 'Race 55 Ah L2',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L2-Gehäuse',
    categorySlug: 'rennsportbatterien',
    variantGroup: 'Race 55 Ah',
    variantLabel: 'L2',
    price: 599,
    sku: 'LI55B1400-12-RL2',
    ean: '4262358250735',
    image: 'race-55ah-l2.webp',
    shortDescription:
      '55 Ah mit 1400 A Kaltstartstrom im längeren L2-Gehäuse, 244 mm.',
    keyData: { voltage: '12,8 V', capacity: '55 Ah', current: '1400 A', weight: '6,5 kg' },
    highlights: ['1400 A Kaltstartstrom', 'L2-Gehäuse, 6,5 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '55 Ah'],
      ['Kaltstartstrom', '1400 A'],
      ['Gewicht', '6,5 kg'],
      ['Abmessung (L x B x H)', '244 x 175 x 189 mm'],
      ['Gehäuse', 'L2'],
      ...gemeinsameDaten('5 A'),
      ['Artikelnummer', 'LI55B1400-12-RL2'],
      ['EAN', '4262358250735'],
    ],
    description: body(
      'Die 55 Ah im L2-Maß: 244 Millimeter lang. Technisch identisch zur L1-Ausführung, für Batteriefächer mit dem längeren Normmaß.',
      ['1400 A Kaltstartstrom bei 244 x 175 x 189 mm (L2)', '6,5 kg Gewicht, aktiver Balancer mit 5 A', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-55ah-l3',
    title: 'Race 55 Ah L3',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L3-Gehäuse',
    categorySlug: 'rennsportbatterien',
    variantGroup: 'Race 55 Ah',
    variantLabel: 'L3',
    price: 599,
    sku: 'LI55B1400-12-RL3',
    ean: '4262358250629',
    /* Vorläufig das Foto der L2: dieselbe Batterie, dasselbe Etikett
       (12V / 55Ah / 1400A), nur das Gehäuse ist länger. Sobald Bulltron ein
       eigenes Foto liefert, im Backend austauschen. */
    image: 'race-55ah-l2.webp',
    shortDescription: '55 Ah mit 1400 A Kaltstartstrom im genormten L3-Gehäuse, 279 mm lang.',
    keyData: { voltage: '12,8 V', capacity: '55 Ah', current: '1400 A', weight: '6,5 kg' },
    highlights: ['1400 A Kaltstartstrom', 'L3-Gehäuse, 6,5 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '55 Ah'],
      ['Kaltstartstrom', '1400 A'],
      ['Gewicht', '6,5 kg'],
      ['Abmessung (L x B x H)', '279 x 175 x 189 mm'],
      ['Gehäuse', 'L3'],
      ...gemeinsameDaten('5 A'),
      ['Artikelnummer', 'LI55B1400-12-RL3'],
      ['EAN', '4262358250629'],
    ],
    description: body(
      'Die 55 Ah im L3-Maß: 279 Millimeter lang. Technisch identisch zur L1- und L2-Ausführung, für Batteriefächer mit dem längeren Normmaß.',
      ['1400 A Kaltstartstrom bei 279 x 175 x 189 mm (L3)', '6,5 kg Gewicht, aktiver Balancer mit 5 A', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-55ah-l5',
    title: 'Race 55 Ah L5',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L5-Gehäuse',
    categorySlug: 'rennsportbatterien',
    variantGroup: 'Race 55 Ah',
    variantLabel: 'L5',
    price: 599,
    sku: 'LI55B1400-12-RL5',
    ean: '4262358250698',
    image: 'race-55ah-l2.webp',
    shortDescription: '55 Ah mit 1400 A Kaltstartstrom im genormten L5-Gehäuse, 355 mm lang.',
    keyData: { voltage: '12,8 V', capacity: '55 Ah', current: '1400 A', weight: '6,8 kg' },
    highlights: ['1400 A Kaltstartstrom', 'L5-Gehäuse, 6,8 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '55 Ah'],
      ['Kaltstartstrom', '1400 A'],
      ['Gewicht', '6,8 kg'],
      ['Abmessung (L x B x H)', '355 x 175 x 189 mm'],
      ['Gehäuse', 'L5'],
      ...gemeinsameDaten('5 A'),
      ['Artikelnummer', 'LI55B1400-12-RL5'],
      ['EAN', '4262358250698'],
    ],
    description: body(
      'Die längste Ausführung der 55 Ah: L5-Maß mit 355 Millimetern. Elektrisch identisch zu L1, L2 und L3, nur das Gehäuse ist anders.',
      ['1400 A Kaltstartstrom bei 355 x 175 x 189 mm (L5)', '6,8 kg Gewicht, aktiver Balancer mit 5 A', ...belegteAussagen],
    ),
  },

  {
    /* Die alte Adresse der 118 Ah. Sie lief bis zum 19.10.2026 mit 301 auf die
       Übersicht, weil die Batterie nicht in der Liste 08/2026 stand. Jetzt
       führt sie wieder auf ein echtes Produkt — die Weiterleitung ist aus
       next.config.mjs und deploy/htaccess-statisch.txt entfernt. */
    slug: 'bulltron-race-118ah-lifepo4',
    title: 'Race 118 Ah L3',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L3-Gehäuse',
    categorySlug: 'rennsportbatterien',
    variantGroup: 'Race 118 Ah',
    variantLabel: 'L3',
    price: 899,
    sku: 'LI118B2000-12-RL3',
    ean: '4262358250711',
    shortDescription: '118 Ah mit 2000 A Kaltstartstrom im genormten L3-Gehäuse, 279 mm lang.',
    keyData: { voltage: '12,8 V', capacity: '118 Ah', current: '2000 A', weight: '9,2 kg' },
    highlights: ['2000 A Kaltstartstrom', '118 Ah Kapazität', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '118 Ah'],
      ['Kaltstartstrom', '2000 A'],
      ['Gewicht', '9,2 kg'],
      ['Abmessung (L x B x H)', '279 x 175 x 189 mm'],
      ['Gehäuse', 'L3'],
      ...gemeinsameDaten('5 A'),
      ['Artikelnummer', 'LI118B2000-12-RL3'],
      ['EAN', '4262358250711'],
    ],
    description: body(
      'Die 118 Ah ist die größte Batterie der Baureihe: 2000 Ampere Kaltstartstrom und 118 Amperestunden Kapazität im genormten L3-Gehäuse.',
      ['2000 A Kaltstartstrom bei 279 x 175 x 189 mm (L3)', '9,2 kg Gewicht, aktiver Balancer mit 5 A', ...belegteAussagen],
    ),
  },

  {
    slug: 'bulltron-race-118ah-l5',
    title: 'Race 118 Ah L5',
    subtitle: '12,8 V LiFePO4 Starterbatterie im L5-Gehäuse',
    categorySlug: 'rennsportbatterien',
    variantGroup: 'Race 118 Ah',
    variantLabel: 'L5',
    price: 899,
    sku: 'LI118B2000-12-RL5',
    ean: '4262358250704',
    shortDescription: '118 Ah mit 2000 A Kaltstartstrom im genormten L5-Gehäuse, 355 mm lang.',
    keyData: { voltage: '12,8 V', capacity: '118 Ah', current: '2000 A', weight: '9,9 kg' },
    highlights: ['2000 A Kaltstartstrom', 'L5-Gehäuse, 9,9 kg', ...belegteAussagen.slice(0, 3)],
    specs: [
      ['Kapazität', '118 Ah'],
      ['Kaltstartstrom', '2000 A'],
      ['Gewicht', '9,9 kg'],
      ['Abmessung (L x B x H)', '355 x 175 x 189 mm'],
      ['Gehäuse', 'L5'],
      ...gemeinsameDaten('5 A'),
      ['Artikelnummer', 'LI118B2000-12-RL5'],
      ['EAN', '4262358250704'],
    ],
    description: body(
      'Die längste Ausführung der 118 Ah: L5-Maß mit 355 Millimetern. Elektrisch identisch zur L3, nur das Gehäuse ist anders.',
      ['2000 A Kaltstartstrom bei 355 x 175 x 189 mm (L5)', '9,9 kg Gewicht, aktiver Balancer mit 5 A', ...belegteAussagen],
    ),
  },
]
