'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { imAusschnitt, projizieren, type Kartendaten } from '../lib/karte'

/**
 * Standortkarte der Händler.
 *
 * Bewusst ohne Kachelserver. Eine Karte aus Kacheln bedeutet einen fremden
 * Server, der die IP jedes Besuchers sieht — und damit eine Einwilligung und
 * ein Banner, auf das die Seite bisher verzichtet. Dazu kommt die Rechtslage
 * bei den Anbietern: Der öffentliche Kachelserver von OpenStreetMap behält
 * sich vor, gewerblichen Seiten den Zugang jederzeit und ohne Vorwarnung zu
 * entziehen, und die kostenlosen Tarife der üblichen Anbieter schließen
 * gewerbliche Nutzung ausdrücklich aus.
 *
 * Diese Karte zeichnet stattdessen die Umrisse selbst, aus einer statischen
 * Datei von rund 20 KB. Kein Anbieter, kein Schlüssel, keine monatliche
 * Grenze, keine Übertragung an Dritte — und sie funktioniert in zehn Jahren
 * noch genauso.
 *
 * Was sie dafür nicht kann: hineinzoomen bis auf Straßenebene. Das braucht sie
 * auch nicht — sie beantwortet „wo sitzen die Händler ungefähr", die Adresse
 * steht in der Liste daneben, und „Route planen" an jedem Eintrag öffnet den
 * Kartendienst der Wahl.
 */

export type Kartenpunkt = {
  id: string
  name: string
  lat?: number | null
  lng?: number | null
  featured?: boolean
  distanz?: number | null
}

type Props = {
  haendler: Kartenpunkt[]
  standort?: { lat: number; lng: number; label: string } | null
  /** Wird beim Klick auf einen Marker gerufen — die Liste springt dann dorthin. */
  onAuswahl?: (id: string) => void
}

export const HaendlerKarte = ({ haendler, standort, onAuswahl }: Props) => {
  const [karte, setKarte] = useState<Kartendaten | null>(null)
  const [fehler, setFehler] = useState(false)
  const [aktiv, setAktiv] = useState<string | null>(null)
  const geladen = useRef(false)

  /* Erst laden, wenn die Karte wirklich gebraucht wird — die Datei ist klein,
     aber die Händlerseite soll ohne sie vollständig nutzbar sein. */
  useEffect(() => {
    if (geladen.current) return
    geladen.current = true
    fetch('/daten/karte-dach.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Kartendaten) => setKarte(d))
      .catch(() => setFehler(true))
  }, [])

  const punkte = useMemo(() => {
    if (!karte) return []
    return haendler
      .filter((h) => typeof h.lat === 'number' && typeof h.lng === 'number')
      .filter((h) => imAusschnitt(karte, h.lat as number, h.lng as number))
      .map((h) => ({ ...h, ...projizieren(karte, h.lat as number, h.lng as number) }))
  }, [karte, haendler])

  const eigenerPunkt = useMemo(() => {
    if (!karte || !standort) return null
    if (!imAusschnitt(karte, standort.lat, standort.lng)) return null
    return { ...projizieren(karte, standort.lat, standort.lng), label: standort.label }
  }, [karte, standort])

  if (fehler) return null
  if (!karte) return <div className="haendler-karte haendler-karte--laedt" aria-hidden="true" />

  return (
    <figure className="haendler-karte">
      <svg
        viewBox={`0 0 ${karte.breite} ${karte.hoehe}`}
        role="img"
        aria-label={`Standorte von ${punkte.length} ${punkte.length === 1 ? 'Partner' : 'Partnern'} in Deutschland, Österreich und der Schweiz`}
      >
        {Object.entries(karte.nachbarn).map(([name, d]) => (
          <path key={name} d={d} className="haendler-karte__nachbar" />
        ))}
        {Object.entries(karte.lieferlaender).map(([name, d]) => (
          <path key={name} d={d} className="haendler-karte__land" />
        ))}

        {eigenerPunkt ? (
          <g className="haendler-karte__standort">
            <circle cx={eigenerPunkt.x} cy={eigenerPunkt.y} r={16} className="haendler-karte__standort-hof" />
            <circle cx={eigenerPunkt.x} cy={eigenerPunkt.y} r={6} />
            <title>{eigenerPunkt.label}</title>
          </g>
        ) : null}

        {punkte.map((p) => (
          <g
            key={p.id}
            className={`haendler-karte__marker${aktiv === p.id ? ' haendler-karte__marker--aktiv' : ''}${
              p.featured ? ' haendler-karte__marker--hervor' : ''
            }`}
            transform={`translate(${p.x} ${p.y})`}
            tabIndex={0}
            role="button"
            aria-label={`${p.name}${typeof p.distanz === 'number' ? `, ${Math.round(p.distanz)} Kilometer entfernt` : ''}`}
            onMouseEnter={() => setAktiv(p.id)}
            onMouseLeave={() => setAktiv(null)}
            onFocus={() => setAktiv(p.id)}
            onBlur={() => setAktiv(null)}
            onClick={() => onAuswahl?.(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onAuswahl?.(p.id)
              }
            }}
          >
            {/* Tropfenform: Spitze sitzt genau auf dem Ort, Kreis darüber. */}
            <path d="M0 0 L-9 -14 A10.5 10.5 0 1 1 9 -14 Z" className="haendler-karte__nadel" />
            <circle cx={0} cy={-20} r={4.2} className="haendler-karte__punkt" />
            <title>{p.name}</title>
          </g>
        ))}
      </svg>

      <figcaption>
        {punkte.length === haendler.length
          ? `${punkte.length} ${punkte.length === 1 ? 'Partner' : 'Partner'} auf der Karte`
          : `${punkte.length} von ${haendler.length} Partnern auf der Karte — bei den übrigen fehlen die Koordinaten`}
      </figcaption>
    </figure>
  )
}
