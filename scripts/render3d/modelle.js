/**
 * Maße und Etikettaufteilung der Bulltron-Race-Batterien.
 *
 * Alle Werte sind an den Produktfotos abgemessen, nicht geschätzt:
 *   - Gehäuse: Verhältnis Breite zu Gesamthöhe
 *   - Etikett: Anteil an Gehäusebreite und -höhe, Abstand von oben
 *   - Schrift: Höhe und Breite jedes Elements in Prozent der ETIKETTBREITE,
 *     Position in Prozent der ETIKETTHÖHE
 *
 * Prozent der Etikettbreite als Maß für Schriftgrößen, weil die Druckvorlage
 * offensichtlich auf die Breite skaliert wurde: die Werte sind über die
 * Baureihen hinweg fast gleich, die Etiketthöhen dagegen nicht.
 */

export const MODELLE = {
  '4ah': {
    titel: 'Race 4 Ah',
    bauart: 'moto',
    /* Gehäuse 1990 x 1559 px im Foto */
    breiteZuHoehe: 1.276,
    tiefeZuBreite: 0.58,
    etikett: { breite: 0.94, hoehe: 0.80, oben: 0.155 },
    text: { chemie: 'LiFePO4', ah: '4Ah', cca: 'CCA 500A', volt: '12V' },
    /* Etikett 1914 x 1263 px */
    layout: {
      chemie: { h: 3.61, b: 16.51, links: 8.41, unten: 25.42 },
      ah: { h: 7.52, b: 20.22, mitte: 50, unten: 30.32 },
      volt: { h: 3.34, b: 8.10, rechts: 94.62, unten: 26.52 },
      cca: { h: 7.99, b: 53.66, mitte: 50, unten: 45.68 },
      logo: { b: 83.5, oben: 49.5, mitte: 50 },
      tagline: { h: 2.61, b: 51.72, mitte: 50, unten: 93.03 },
    },
  },

  '12ah': {
    titel: 'Race 12 Ah',
    bauart: 'moto',
    /* Gehäuse 2620 x 2430 px im Foto */
    breiteZuHoehe: 1.078,
    tiefeZuBreite: 0.58,
    etikett: { breite: 0.885, hoehe: 0.838, oben: 0.109 },
    text: { chemie: 'LiFePO4', ah: '12Ah', cca: 'CCA 1000A', volt: '12V' },
    /* Etikett 2302 x 2032 px */
    layout: {
      chemie: { h: 5.08, b: 24.37, links: 5.56, unten: 18.75 },
      ah: { h: 7.38, b: 26.11, mitte: 50, unten: 31.89 },
      volt: { h: 4.91, b: 11.90, rechts: 96.57, unten: 19.29 },
      cca: { h: 7.65, b: 59.99, mitte: 50, unten: 47.64 },
      logo: { b: 69.4, oben: 54.5, mitte: 50 },
      tagline: { h: 1.95, b: 43.87, mitte: 50, unten: 86.27 },
    },
  },

  '27ah': {
    titel: 'Race 27 Ah',
    bauart: 'auto',
    /* Gehäuse 4990 x 3586 px im Foto */
    breiteZuHoehe: 1.392,
    tiefeZuBreite: 0.63,
    etikett: { breite: 0.951, hoehe: 0.853, oben: 0.116 },
    /* Grau statt Schwarz: das Etikett dieser Baureihe ist heller. */
    grund: '#26272a',
    text: { chemie: 'LiFePO4', zeile1: '12V / 27Ah', zeile2: '700A' },
    /* Etikett 4745 x 3058 px */
    layout: {
      chemie: { h: 2.82, b: 16.65, links: 6.66, unten: 14.6 },
      logo: { b: 57.0, oben: 12.4, mitte: 52 },
      zeile1: { h: 5.14, b: 38.0, mitte: 53.0, unten: 53.86 },
      zeile2: { h: 7.78, b: 31.5, mitte: 56.3, unten: 69.36 },
      siegel: { d: 19.0, mitteX: 14.0, mitteY: 66.5 },
      tagline: { h: 1.94, b: 48.0, mitte: 62, unten: 93.33 },
    },
  },
}
