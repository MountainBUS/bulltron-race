/**
 * Trägt Baureihe und Bauform bei den vorhandenen Batterien nach.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/bauform-varianten.ts
 *
 * Der Seed setzt diese Felder seit dem 07.10.2026 mit, aber nur beim Aufbau
 * einer frischen Instanz. Auf Dev und Live stehen die Produkte längst, deshalb
 * dieses Skript.
 *
 * ZUORDNUNG ÜBER DIE ARTIKELNUMMER, nicht über den Namen: Titel werden
 * redaktionell geändert, die SKU nicht. Findet sich eine Artikelnummer nicht,
 * sagt das Skript es und lässt den Rest unberührt.
 *
 * MEHRFACH AUSFÜHRBAR, und zwar vorsichtig: Steht bei einem Produkt schon eine
 * Baureihe oder Bauform, wird sie nicht überschrieben — auch dann nicht, wenn
 * sie von der Vorgabe hier abweicht. Redaktionelle Änderungen im Backend haben
 * damit Vorrang, und das Skript sagt am Ende, was es übersprungen hat.
 *
 * Die drei Batterien ohne Geschwister (4, 6 und 12 Ah) bleiben absichtlich
 * leer: Eine Auswahl mit nur einem Eintrag ergibt keinen Sinn, und die
 * Produktseite lässt den Abschnitt dann weg.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })

/* Die 27 Ah gibt es in vier Gehäusen, die 55 Ah in zwei. Dass die
   Metall-Variante mit in die Auswahl gehört, hat Marco am 07.10.2026
   entschieden: elektrisch ist sie mit den L-Gehäusen identisch (27 Ah, 700 A),
   sie wiegt nur 3,0 statt 3,5 kg und kostet 100 Euro mehr. */
const VORGABE: { sku: string; baureihe: string; bauform: string }[] = [
  { sku: 'LI27B700-12-RM', baureihe: 'Race 27 Ah', bauform: 'Metall' },
  { sku: 'LI27B700-12-RL1', baureihe: 'Race 27 Ah', bauform: 'L1' },
  { sku: 'LI27B700-12-RL2', baureihe: 'Race 27 Ah', bauform: 'L2' },
  { sku: 'LI27B700-12-RL3', baureihe: 'Race 27 Ah', bauform: 'L3' },
  { sku: 'LI55B1400-12-RL1', baureihe: 'Race 55 Ah', bauform: 'L1' },
  { sku: 'LI55B1400-12-RL2', baureihe: 'Race 55 Ah', bauform: 'L2' },
]

const gefuellt = (wert: unknown): boolean => typeof wert === 'string' && wert.trim().length > 0

const gesetzt: string[] = []
const uebersprungen: string[] = []
const fehlend: string[] = []

for (const { sku, baureihe, bauform } of VORGABE) {
  const treffer = await payload.find({
    collection: 'products',
    where: { sku: { equals: sku } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const produkt = treffer.docs[0] as Record<string, any> | undefined

  if (!produkt) {
    fehlend.push(sku)
    continue
  }

  if (gefuellt(produkt.variantGroup) || gefuellt(produkt.variantLabel)) {
    uebersprungen.push(
      `${produkt.title} (${sku}) — steht schon auf „${produkt.variantGroup ?? ''}" / „${produkt.variantLabel ?? ''}"`,
    )
    continue
  }

  await payload.update({
    collection: 'products',
    id: produkt.id,
    data: { variantGroup: baureihe, variantLabel: bauform } as never,
    overrideAccess: true,
  })
  gesetzt.push(`${produkt.title} (${sku}) → ${baureihe} / ${bauform}`)
}

if (gesetzt.length === 0) {
  payload.logger.info('Nichts zu tun — bei allen sechs Batterien steht die Bauform schon.')
} else {
  payload.logger.info(`Gesetzt (${gesetzt.length}):`)
  for (const z of gesetzt) payload.logger.info('  - ' + z)
}
for (const z of uebersprungen) payload.logger.warn('Übersprungen: ' + z)
for (const z of fehlend) payload.logger.error(`Artikelnummer ${z} nicht gefunden — bitte von Hand prüfen.`)

/* Zum Schluss nachzählen, was im Frontend ankommt: Eine Baureihe mit nur einem
   Mitglied zeigt keine Auswahl, und das wäre hier ein Fehler. */
const alle = await payload.find({ collection: 'products', limit: 200, depth: 0, overrideAccess: true })
const gruppen = new Map<string, string[]>()
for (const p of alle.docs as Record<string, any>[]) {
  const schluessel = typeof p.variantGroup === 'string' ? p.variantGroup.trim().replace(/\s+/g, ' ').toLowerCase() : ''
  if (!schluessel) continue
  gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), p.variantLabel || p.title])
}
payload.logger.info('Baureihen im Bestand:')
for (const [schluessel, mitglieder] of gruppen) {
  const zeile = `  ${schluessel}: ${mitglieder.length} Bauformen (${mitglieder.join(', ')})`
  if (mitglieder.length < 2) payload.logger.warn(zeile + ' — allein, zeigt keine Auswahl')
  else payload.logger.info(zeile)
}
process.exit(0)
