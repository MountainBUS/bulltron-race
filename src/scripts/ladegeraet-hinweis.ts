/**
 * Richtet den Ladegerät-Hinweis auf allen Seiten einheitlich aus.
 *
 * Im Container ausführen:
 *   node_modules/.bin/payload run src/scripts/ladegeraet-hinweis.ts
 *
 * WAS SICH WIDERSPRACH: Die Kachel auf der Startseite sagte „Kein
 * Spezialladegerät nötig", die FAQ der Motorsportbatterien antwortete auf
 * dieselbe Frage mit „Ja", und unter jedem Produkttext stand „Verwende ein
 * Ladegerät mit Lithium-Kennlinie". Bulltron hat über Marco am 08.10.2026
 * bestätigt: Ein handelsübliches Ladegerät genügt, ein besonderes ist nicht
 * erforderlich. Die Kachel hatte also recht, die beiden anderen Stellen nicht.
 *
 * ERSETZT WIRD NUR, WAS WÖRTLICH ÜBEREINSTIMMT. Hat jemand den Text im
 * Backend inzwischen umformuliert, bleibt er unangetastet und das Skript sagt
 * es. Lieber eine Stelle von Hand nacharbeiten als eine redaktionelle Änderung
 * stillschweigend überschreiben.
 *
 * MEHRFACH AUSFÜHRBAR.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })

/* Zwei Ausgangsfassungen werden ersetzt: die ursprüngliche Antwort („Ja …")
   und die erste Korrektur vom 08.10.2026, die zwar richtig war, aber die
   Ladeschlussspannung nicht nannte. Die Produkttexte führen diese Grenze
   bereits — eine FAQ, die ungenauer ist als die Produktseite, nützt niemandem.
   Der Wortlaut stammt von Bulltron selbst, aus dem Hinweis unter den
   Produktbeschreibungen. */
const FAQ_ALT = [
  'Ja. Lithium-Batterien benötigen ein Ladegerät mit Lithium-Kennlinie. Ein klassisches Bleiladegerät lädt die Batterie nicht vollständig und kann die Lebensdauer verkürzen.',
  'Nein. Zum Laden genügt ein handelsübliches Ladegerät, ein besonderes Lithium-Ladegerät ist nicht erforderlich.',
]
const FAQ_NEU = 'Nein. Unsere Batterien benötigen kein spezielles Lithium-Ladegerät. Du kannst jedes Ladegerät mit einer maximalen Ladespannung von 14,6 V verwenden.'

const WINTER_ALT = 'Lithium-Batterien haben eine geringe Selbstentladung und überstehen die Winterpause meist ohne Nachladen. Bei Standzeiten über mehrere Monate empfehlen wir trotzdem ein Erhaltungsladegerät mit Lithium-Kennlinie.'
const WINTER_NEU = 'Lithium-Batterien haben eine geringe Selbstentladung und überstehen die Winterpause meist ohne Nachladen. Bei Standzeiten über mehrere Monate empfehlen wir trotzdem ein Erhaltungsladegerät.'

const PRODUKT_ALT = 'Hinweis: Lithium-Batterien benötigen ein passendes Ladeprofil. Verwende ein Ladegerät mit Lithium-Kennlinie oder sprich uns an — wir sagen dir, was zu deinem Fahrzeug passt.'
const PRODUKT_NEU = 'Hinweis: Zum Laden genügt ein handelsübliches Ladegerät, ein besonderes Lithium-Ladegerät ist nicht erforderlich. Bei Fragen zum passenden Gerät sprich uns an — wir sagen dir, was zu deinem Fahrzeug passt.'

const geaendert: string[] = []
const unberuehrt: string[] = []

/* --- Kategorien: die beiden FAQ-Antworten ---------------------------------- */
const kategorien = await payload.find({ collection: 'categories', limit: 100, depth: 0, overrideAccess: true })

for (const kategorie of kategorien.docs as Record<string, any>[]) {
  const faq = Array.isArray(kategorie.faq) ? kategorie.faq : []
  let getroffen = false
  const neu = faq.map((eintrag: Record<string, any>) => {
    if (FAQ_ALT.includes(eintrag?.answer)) {
      getroffen = true
      return { ...eintrag, answer: FAQ_NEU }
    }
    if (eintrag?.answer === WINTER_ALT) {
      getroffen = true
      return { ...eintrag, answer: WINTER_NEU }
    }
    return eintrag
  })
  if (!getroffen) continue
  await payload.update({ collection: 'categories', id: kategorie.id, data: { faq: neu } as never, overrideAccess: true })
  geaendert.push(`Kategorie ${kategorie.title ?? kategorie.slug}: FAQ`)
}

/* Wo die alte Frage noch steht, ohne dass die Antwort wörtlich passt. */
for (const kategorie of (await payload.find({ collection: 'categories', limit: 100, depth: 0, overrideAccess: true }))
  .docs as Record<string, any>[]) {
  for (const eintrag of Array.isArray(kategorie.faq) ? kategorie.faq : []) {
    if (typeof eintrag?.answer === 'string' && /Lithium-Kennlinie/.test(eintrag.answer)) {
      unberuehrt.push(`Kategorie ${kategorie.title ?? kategorie.slug}: „${String(eintrag.question).slice(0, 60)}" nennt weiterhin die Lithium-Kennlinie`)
    }
  }
}

/* --- Produkte: der Hinweis im Beschreibungstext ---------------------------
   Die Beschreibung ist ein Lexical-Baum. Gesucht wird der Textknoten, der
   wörtlich dem alten Hinweis entspricht; nur dessen `text` wird getauscht.
   Der Baum bleibt sonst unangetastet — ihn neu zu bauen würde jede
   redaktionelle Formatierung verlieren. */
const tauschen = (knoten: any): boolean => {
  if (!knoten || typeof knoten !== 'object') return false
  let getroffen = false
  if (knoten.type === 'text' && knoten.text === PRODUKT_ALT) {
    knoten.text = PRODUKT_NEU
    getroffen = true
  }
  for (const kind of Array.isArray(knoten.children) ? knoten.children : []) {
    if (tauschen(kind)) getroffen = true
  }
  return getroffen
}

const produkte = await payload.find({ collection: 'products', limit: 200, depth: 0, overrideAccess: true })
for (const produkt of produkte.docs as Record<string, any>[]) {
  const beschreibung = produkt.description
  if (!beschreibung?.root) continue
  const kopie = JSON.parse(JSON.stringify(beschreibung))
  if (!tauschen(kopie.root)) {
    const text = JSON.stringify(beschreibung)
    if (/Lithium-Kennlinie/.test(text)) {
      unberuehrt.push(`Produkt ${produkt.title}: Beschreibung nennt weiterhin die Lithium-Kennlinie, Wortlaut weicht ab`)
    }
    continue
  }
  await payload.update({ collection: 'products', id: produkt.id, data: { description: kopie } as never, overrideAccess: true })
  geaendert.push(`Produkt ${produkt.title}: Hinweis im Beschreibungstext`)
}

if (geaendert.length === 0) payload.logger.info('Nichts zu ändern — die Texte stehen bereits richtig.')
else {
  payload.logger.info(`Geändert (${geaendert.length}):`)
  for (const z of geaendert) payload.logger.info('  - ' + z)
}
for (const z of unberuehrt) payload.logger.warn('Bitte von Hand ansehen: ' + z)
process.exit(0)
