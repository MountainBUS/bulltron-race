'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

/**
 * Knopf zum Stornieren einer Rechnung, in der Seitenleiste des Backends.
 *
 * Der Knopf stößt nur an; gerechnet und geschrieben wird auf dem Server
 * (`/api/invoices/:id/storno`). Hier steht bewusst keine Logik — eine zweite
 * Stelle, an der entschieden wird, was ein Storno ist, wäre eine Stelle zu
 * viel.
 *
 * Es gibt keine Rückfrage per `confirm()`: Ein Browser-Dialog blockiert die
 * Seite. Stattdessen muss der Grund eingetippt und ein zweites Mal geklickt
 * werden — das ist Hürde genug gegen einen Fehlklick.
 */
export const StornoKnopf: React.FC = () => {
  const { id, savedDocumentData } = useDocumentInfo() as {
    id?: string | number
    savedDocumentData?: Record<string, any>
  }
  const [offen, setOffen] = useState(false)
  const [grund, setGrund] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<string | null>(null)

  if (!id) return null

  const art = savedDocumentData?.kind
  const storniert = savedDocumentData?.cancelled

  if (art === 'cancellation') {
    return <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Dies ist eine Stornorechnung.</p>
  }
  if (storniert) {
    return <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Diese Rechnung ist storniert.</p>
  }

  const stornieren = async () => {
    setLaeuft(true)
    setMeldung(null)
    try {
      const antwort = await fetch(`/api/invoices/${id}/storno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ grund }),
      })
      const daten = await antwort.json()
      if (!antwort.ok) {
        setMeldung(typeof daten?.error === 'string' ? daten.error : 'Das Storno ist fehlgeschlagen.')
        return
      }
      setMeldung(`Stornorechnung ${daten.storno} angelegt. Die Seite wird neu geladen.`)
      window.setTimeout(() => window.location.reload(), 1200)
    } catch {
      setMeldung('Das Storno konnte nicht ausgelöst werden.')
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {!offen ? (
        <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setOffen(true)}>
          Rechnung stornieren
        </button>
      ) : (
        <>
          <label style={{ fontSize: '0.8rem' }} htmlFor="storno-grund">
            Grund (erscheint auf der Stornorechnung)
          </label>
          <input
            id="storno-grund"
            type="text"
            value={grund}
            onChange={(e) => setGrund(e.target.value)}
            placeholder="z. B. Kunde hat widerrufen"
            style={{ padding: '0.45rem 0.6rem', width: '100%' }}
          />
          <button type="button" className="btn btn--style-primary btn--size-small" disabled={laeuft} onClick={stornieren}>
            {laeuft ? 'Storno läuft …' : 'Storno jetzt anlegen'}
          </button>
          <button type="button" className="btn btn--style-none btn--size-small" onClick={() => setOffen(false)}>
            Abbrechen
          </button>
        </>
      )}
      {meldung ? <p style={{ fontSize: '0.8rem' }}>{meldung}</p> : null}
    </div>
  )
}
