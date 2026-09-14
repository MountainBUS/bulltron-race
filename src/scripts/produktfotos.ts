/**
 * Weist den Produkten die echten Fotos zu — auf einer bereits laufenden
 * Instanz, ohne den Seed erneut auszuführen.
 *
 * Hintergrund: Der Seed legt Produkte, Kategorien, Seiten und Medien neu an und
 * löscht vorher alles. Auf einer Instanz mit gepflegten Inhalten darf er nicht
 * noch einmal laufen. Dieses Skript lädt nur die Bilder hoch und hängt sie an
 * die passenden Artikelnummern.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/produktfotos.ts
 *
 * Mehrfach ausführbar. Ein Produkt, dessen Bild jemand im Backend von Hand
 * gesetzt hat, wird nicht angefasst — erkennbar daran, dass sein Dateiname
 * nicht in der Liste unten steht. So überschreibt ein zweiter Lauf keine
 * redaktionelle Arbeit.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getPayload } from 'payload'
import config from '../payload.config'

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed', 'assets')

/**
 * Artikelnummer → Fotodatei.
 *
 * Die Zuordnung der Kunststoff-Gehäuse steht auf dem Etikett (4 Ah/500 A,
 * 6 Ah/650 A, 12 Ah/1000 A). Bei den L-Gehäusen tragen alle Fotos dieselbe
 * Beschriftung, dort wurde über das gemessene Seitenverhältnis des Gehäuses
 * zugeordnet: L1 = 207 mm, L2 = 244 mm, L3 = 279 mm Länge bei gleicher Höhe.
 * Die beiden 55-Ah-Fotos dienten als Maßstab, weil es davon genau zwei gibt;
 * die drei 27-Ah-Fotos treffen damit auf unter zwei Prozent genau.
 *
 * Für die 27 Ah im Metall-Gehäuse (LI27B700-12-RM) liegt kein Foto vor — sie
 * behält ihr Platzhalterbild.
 */
const fotos: Record<string, { datei: string; alt: string }> = {
  'LI4B500-12-R1': { datei: 'race-4ah.webp', alt: 'Bulltron Race 4 Ah, 12,8 V LiFePO4 Starterbatterie im Kunststoff-Gehäuse' },
  'LI6B650-12-R1': { datei: 'race-6ah.webp', alt: 'Bulltron Race 6 Ah, 12,8 V LiFePO4 Starterbatterie im Kunststoff-Gehäuse' },
  'LI12B1000-12-R': { datei: 'race-12ah.webp', alt: 'Bulltron Race 12 Ah, 12,8 V LiFePO4 Starterbatterie im Kunststoff-Gehäuse' },
  'LI27B700-12-RL1': { datei: 'race-27ah-l1.webp', alt: 'Bulltron Race 27 Ah, 12,8 V LiFePO4 Starterbatterie im L1-Gehäuse' },
  'LI27B700-12-RL2': { datei: 'race-27ah-l2.webp', alt: 'Bulltron Race 27 Ah, 12,8 V LiFePO4 Starterbatterie im L2-Gehäuse' },
  'LI27B700-12-RL3': { datei: 'race-27ah-l3.webp', alt: 'Bulltron Race 27 Ah, 12,8 V LiFePO4 Starterbatterie im L3-Gehäuse' },
  'LI55B1400-12-RL1': { datei: 'race-55ah-l1.webp', alt: 'Bulltron Race 55 Ah, 12,8 V LiFePO4 Starterbatterie im L1-Gehäuse' },
  'LI55B1400-12-RL2': { datei: 'race-55ah-l2.webp', alt: 'Bulltron Race 55 Ah, 12,8 V LiFePO4 Starterbatterie im L2-Gehäuse' },
}

/** Erzeugte Platzhalter, die ersetzt werden dürfen. */
const platzhalter = /^batterie-/

const payload = await getPayload({ config })

let gesetzt = 0
let uebersprungen = 0

for (const [sku, { datei, alt }] of Object.entries(fotos)) {
  const dateipfad = path.join(assets, datei)
  if (!fs.existsSync(dateipfad)) {
    payload.logger.error(`Datei fehlt: ${datei}`)
    continue
  }

  const treffer = await payload.find({
    collection: 'products',
    where: { sku: { equals: sku } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const produkt = treffer.docs[0] as Record<string, any> | undefined
  if (!produkt) {
    payload.logger.warn(`Kein Produkt mit Artikelnummer ${sku}`)
    continue
  }

  const bisher = produkt.mainImage
  const bisherigerName = bisher && typeof bisher === 'object' ? String(bisher.filename ?? '') : ''

  if (bisherigerName === datei) {
    uebersprungen++
    continue
  }
  if (bisherigerName && !platzhalter.test(bisherigerName)) {
    payload.logger.info(`${produkt.title}: eigenes Bild „${bisherigerName}" bleibt unangetastet`)
    uebersprungen++
    continue
  }

  const medium = await payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt },
    filePath: dateipfad,
  })

  await payload.update({
    collection: 'products',
    id: produkt.id,
    overrideAccess: true,
    data: { mainImage: medium.id },
  })

  payload.logger.info(`${produkt.title}: ${datei} zugewiesen`)
  gesetzt++
}

payload.logger.info(`Fertig — ${gesetzt} Fotos gesetzt, ${uebersprungen} unverändert.`)
process.exit(0)
