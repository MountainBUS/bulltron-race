'use client'

import React, { useState } from 'react'

/**
 * Zeitraum wählen und die beiden Exporte herunterladen — über der Liste der
 * Rechnungen.
 *
 * Die Felder bauen nur die Adresse zusammen und öffnen sie; erzeugt werden ZIP
 * und CSV auf dem Server. Ein Export, der im Browser zusammengesetzt würde,
 * könnte nur das zeigen, was gerade geladen ist, und das sind höchstens die
 * ersten Seiten der Liste.
 */
export const RechnungsExport: React.FC = () => {
  const jahr = new Date().getFullYear()
  const [von, setVon] = useState(`${jahr}-01-01`)
  const [bis, setBis] = useState(`${jahr}-12-31`)

  const holen = (art: 'zip' | 'csv') => {
    window.location.href = `/api/invoices/export/${art}?von=${encodeURIComponent(von)}&bis=${encodeURIComponent(bis)}`
  }

  const feld: React.CSSProperties = { padding: '0.45rem 0.6rem' }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: '0.75rem',
        padding: '1rem',
        marginBottom: '1.25rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '3px',
      }}
    >
      <div style={{ display: 'grid', gap: '0.3rem' }}>
        <label htmlFor="export-von" style={{ fontSize: '0.8rem' }}>
          Von
        </label>
        <input id="export-von" type="date" value={von} onChange={(e) => setVon(e.target.value)} style={feld} />
      </div>
      <div style={{ display: 'grid', gap: '0.3rem' }}>
        <label htmlFor="export-bis" style={{ fontSize: '0.8rem' }}>
          Bis einschließlich
        </label>
        <input id="export-bis" type="date" value={bis} onChange={(e) => setBis(e.target.value)} style={feld} />
      </div>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => holen('zip')}>
        Rechnungen als ZIP
      </button>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => holen('csv')}>
        CSV für den Steuerberater
      </button>
      <p style={{ fontSize: '0.78rem', opacity: 0.7, flexBasis: '100%', margin: 0 }}>
        Das ZIP enthält alle Rechnungs-PDFs des Zeitraums, die CSV je eine Zeile mit Netto, Steuer und Brutto. Fehlt zu
        einer Rechnung die PDF-Datei, nennt eine Textdatei im Archiv die betroffenen Nummern.
      </p>
    </div>
  )
}
