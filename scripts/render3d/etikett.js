/**
 * Zeichnet das Etikett einer Bulltron-Race-Batterie auf ein Canvas.
 *
 * Jedes Element wird auf die am Foto gemessene Höhe UND Breite gebracht.
 * Dafür wird die Schriftgröße aus der gemessenen Versalhöhe bestimmt und die
 * Zeile danach waagerecht so gestaucht oder gedehnt, dass auch die Breite
 * stimmt. Barlow Condensed ist nicht die Originalschrift des Etiketts; ohne
 * diesen Ausgleich träfe entweder die Höhe oder die Breite, nie beides.
 */

/* Das Originaletikett ist in einer normal breiten Grotesk gesetzt, nicht in
   einer schmalen. Gemessen: Versalbreite zu Versalhöhe rund 0,85 — das passt
   zu Arial/Helvetica, nicht zu Barlow Condensed. Liberation Sans ist mit Arial
   maßgleich und liegt hier vor. */
const SCHRIFT = '"Liberation Sans", Arial, Helvetica, sans-serif'
/* Der Claim unten ist deutlich schmaler gesetzt als der Rest — dafür eine
   schmale Grotesk, sonst müsste er stark gestaucht werden. */
const SCHRIFT_TAG = '"DejaVu Sans", "Liberation Sans", sans-serif'

/** Größte tatsächliche Höhe eines Textes bei gegebener Schriftgröße. */
const gemessen = (g, text, groesse, familie, stil = '700') => {
  g.font = `${stil} ${groesse}px ${familie}`
  const m = g.measureText(text)
  return {
    hoehe: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
    breite: m.width,
    ascent: m.actualBoundingBoxAscent,
  }
}

/**
 * Setzt eine Zeile so, dass sie exakt zielH hoch und zielB breit wird.
 * x ist je nach Ausrichtung die linke Kante, die Mitte oder die rechte Kante.
 */
const zeile = (g, text, { zielH, zielB, x, unten, richtung = 'mitte', familie = SCHRIFT, stil = '700', nachBreite = false }) => {
  const probe = gemessen(g, text, 100, familie, stil)
  /* Bei kleiner Schrift ist die am Foto gemessene Höhe durch die Kantenglättung
     zu groß. Dort zählt die Breite, sonst die Höhe. */
  const groesse = nachBreite
    ? (zielB / probe.breite) * 100
    : (zielH / probe.hoehe) * 100
  const echt = gemessen(g, text, groesse, familie, stil)
  const dehnung = nachBreite ? 1 : zielB / echt.breite

  let links = x
  if (richtung === 'mitte') links = x - zielB / 2
  if (richtung === 'rechts') links = x - zielB

  g.save()
  g.translate(links, unten)
  g.scale(dehnung, 1)
  g.textAlign = 'left'
  g.textBaseline = 'alphabetic'
  g.font = `${stil} ${groesse}px ${familie}`
  g.fillText(text, 0, 0)
  g.restore()

  if (typeof window !== 'undefined' && window.dehnungen) {
    window.dehnungen.push({ text, dehnung: Math.round(dehnung * 1000) / 1000 })
  }
  return { groesse, dehnung }
}

/** Das Siegel „Designed & developed in Germany“ der Auto-Baureihe. */
const siegelZeichnen = (g, cx, cy, d) => {
  const r = d / 2
  g.save()
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fillStyle = '#ffffff'
  g.fill()

  /* Vereinfachter Umriss Deutschlands in den Landesfarben. */
  const bh = r * 0.92
  const bb = bh * 0.72
  g.beginPath()
  g.rect(cx - bb / 2, cy - bh / 2, bb, bh / 3)
  g.fillStyle = '#111111'
  g.fill()
  g.beginPath()
  g.rect(cx - bb / 2, cy - bh / 2 + bh / 3, bb, bh / 3)
  g.fillStyle = '#d00f1a'
  g.fill()
  g.beginPath()
  g.rect(cx - bb / 2, cy - bh / 2 + (2 * bh) / 3, bb, bh / 3)
  g.fillStyle = '#f5c518'
  g.fill()

  g.beginPath()
  g.arc(cx, cy, r * 0.99, 0, Math.PI * 2)
  g.lineWidth = r * 0.07
  g.strokeStyle = '#111111'
  g.stroke()
  g.restore()
}

/**
 * @param c      Ziel-Canvas
 * @param logo   geladenes Image mit dem Logo (Auto, Wortmarke, Claim)
 * @param modell Eintrag aus modelle.js
 * @param breite Canvasbreite in Pixeln
 */
export const etikettZeichnen = (c, logo, modell, breite = 2400) => {
  const verhaeltnis =
    (modell.etikett.breite * modell.breiteZuHoehe) / modell.etikett.hoehe
  c.width = breite
  c.height = Math.round(breite / verhaeltnis)
  const g = c.getContext('2d')
  const B = c.width
  const H = c.height
  const pb = (v) => (v / 100) * B // Prozent der Etikettbreite
  const ph = (v) => (v / 100) * H // Prozent der Etiketthöhe
  const L = modell.layout

  g.fillStyle = modell.grund ?? '#08090a'
  g.fillRect(0, 0, B, H)

  /* Sehr schwache Aufhellung, damit die Fläche im Rendering nicht tot wirkt. */
  const verlauf = g.createLinearGradient(0, 0, B * 0.8, H)
  verlauf.addColorStop(0, 'rgba(255,255,255,0.05)')
  verlauf.addColorStop(0.5, 'rgba(255,255,255,0.012)')
  verlauf.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = verlauf
  g.fillRect(0, 0, B, H)

  g.fillStyle = '#ffffff'

  const logoBreite = pb(L.logo.b)
  const logoHoehe = logo && logo.naturalWidth
    ? (logo.naturalHeight / logo.naturalWidth) * logoBreite
    : 0

  if (modell.bauart === 'moto') {
    zeile(g, modell.text.chemie, {
      zielH: pb(L.chemie.h), zielB: pb(L.chemie.b),
      x: pb(L.chemie.links), unten: ph(L.chemie.unten), richtung: 'links', stil: '700', nachBreite: true,
    })
    zeile(g, modell.text.volt, {
      zielH: pb(L.volt.h), zielB: pb(L.volt.b),
      x: pb(L.volt.rechts), unten: ph(L.volt.unten), richtung: 'rechts', stil: '700', nachBreite: true,
    })
    zeile(g, modell.text.ah, {
      zielH: pb(L.ah.h), zielB: pb(L.ah.b),
      x: pb(L.ah.mitte), unten: ph(L.ah.unten),
    })
    zeile(g, modell.text.cca, {
      zielH: pb(L.cca.h), zielB: pb(L.cca.b),
      x: pb(L.cca.mitte), unten: ph(L.cca.unten),
    })
    if (logoHoehe) {
      g.drawImage(logo, pb(L.logo.mitte) - logoBreite / 2, ph(L.logo.oben), logoBreite, logoHoehe)
    }
    g.fillStyle = '#e9eaec'
    zeile(g, 'Die innovative Batterie aus Deutschland', {
      zielH: pb(L.tagline.h), zielB: pb(L.tagline.b),
      x: pb(L.tagline.mitte), unten: ph(L.tagline.unten),
      familie: SCHRIFT_TAG, stil: 'italic 700 condensed', nachBreite: true,
    })
  } else {
    if (logoHoehe) {
      g.drawImage(logo, pb(L.logo.mitte) - logoBreite / 2, ph(L.logo.oben), logoBreite, logoHoehe)
    }
    zeile(g, modell.text.chemie, {
      zielH: pb(L.chemie.h), zielB: pb(L.chemie.b),
      x: pb(L.chemie.links), unten: ph(L.chemie.unten), richtung: 'links', stil: '700', nachBreite: true,
    })
    zeile(g, modell.text.zeile1, {
      zielH: pb(L.zeile1.h), zielB: pb(L.zeile1.b),
      x: pb(L.zeile1.mitte), unten: ph(L.zeile1.unten),
    })
    zeile(g, modell.text.zeile2, {
      zielH: pb(L.zeile2.h), zielB: pb(L.zeile2.b),
      x: pb(L.zeile2.mitte), unten: ph(L.zeile2.unten),
    })
    siegelZeichnen(g, pb(L.siegel.mitteX), ph(L.siegel.mitteY), pb(L.siegel.d))
    g.fillStyle = '#e9eaec'
    zeile(g, 'Die innovative Batterie aus Deutschland', {
      zielH: pb(L.tagline.h), zielB: pb(L.tagline.b),
      x: pb(L.tagline.mitte), unten: ph(L.tagline.unten),
      familie: SCHRIFT_TAG, stil: 'italic 700 condensed', nachBreite: true,
    })
  }

  return c
}

/** Schriften laden, bevor gezeichnet wird — sonst setzt Canvas die Ersatzschrift. */
export const schriftenLaden = () => document.fonts.ready
