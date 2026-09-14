import { doc, h, p, ul } from './lexical'

/**
 * Produktdaten aus der Händler-Preisliste 08/2026 (Neue Modelle).
 *
 * Alle Werte — Artikelnummer, EAN, Kaltstartstrom, Maße, Gewicht, Balancer und
 * UVP — stammen aus dieser Liste. Nichts davon ist geschätzt oder ergänzt.
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
  price: number
  sku: string
  ean: string
  image: string
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
  '5 Jahre deutsche Herstellergarantie',
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
      'Hinweis: Lithium-Batterien benötigen ein passendes Ladeprofil. Verwende ein Ladegerät mit Lithium-Kennlinie oder sprich uns an — wir sagen dir, was zu deinem Fahrzeug passt.',
    ),
  ])

/** Technische Daten, die bei jeder Batterie der Baureihe gleich sind. */
const gemeinsameDaten = (balancer: string): [string, string][] => [
  ['Nennspannung', '12,8 V (für 12-V-Bordnetze)'],
  ['Zellchemie', 'LiFePO4'],
  ['Aktiver Balancer', balancer],
  ['Ladetemperatur', 'bis −20 °C'],
  ['Entladetemperatur', 'bis −30 °C'],
  ['Garantie', '5 Jahre deutsche Herstellergarantie'],
  ['Herkunft', 'Entwickelt und konfektioniert in Lüneburg'],
]

export const seedProducts: SeedProduct[] = [
  {
    slug: 'bulltron-race-4ah-12v',
    title: 'Race 4 Ah',
    subtitle: '12,8 V LiFePO4 Starterbatterie',
    categorySlug: 'motorradbatterien',
    price: 199,
    sku: 'LI4B500-12-R1',
    ean: '4262358250810',
    image: 'batterie-4ah.png',
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
    slug: 'bulltron-race-6ah-12v',
    title: 'Race 6 Ah',
    subtitle: '12,8 V LiFePO4 Starterbatterie',
    categorySlug: 'motorradbatterien',
    price: 249,
    sku: 'LI6B650-12-R1',
    ean: '4262358250834',
    image: 'batterie-6ah.png',
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
    slug: 'bulltron-race-12ah-12v',
    title: 'Race 12 Ah',
    subtitle: '12,8 V LiFePO4 Starterbatterie',
    categorySlug: 'motorradbatterien',
    price: 399,
    sku: 'LI12B1000-12-R',
    ean: '4262358250858',
    image: 'batterie-12ah.png',
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
    price: 399,
    sku: 'LI27B700-12-RL1',
    ean: '4262358250759',
    image: 'batterie-27ah-lifepo.png',
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
    price: 399,
    sku: 'LI27B700-12-RL2',
    ean: '4262358250766',
    image: 'batterie-27ah-lifepo.png',
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
    price: 399,
    sku: 'LI27B700-12-RL3',
    ean: '4262358250773',
    image: 'batterie-27ah-lifepo.png',
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
    price: 599,
    sku: 'LI55B1400-12-RL1',
    ean: '4262358250742',
    image: 'batterie-55ah.png',
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
    price: 599,
    sku: 'LI55B1400-12-RL2',
    ean: '4262358250735',
    image: 'batterie-55ah-lifepo.png',
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
]
