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

const STATUS_LABEL: Record<string, string> = {
  haendler: 'Händler',
  einbaupartner: 'Einbaupartner',
}

export type Kartenpunkt = {
  id: string
  name: string
  lat?: number | null
  lng?: number | null
  featured?: boolean
  distanz?: number | null
  /* Für die Hover-Karte am Marker. Alles optional: fehlt eine Angabe, fällt die
     Zeile weg, statt eine leere Zeile zu hinterlassen. */
  street?: string | null
  postalCode?: string | null
  city?: string | null
  status?: string[]
  statusFreitext?: string | null
  website?: string | null
}

type Props = {
  haendler: Kartenpunkt[]
  standort?: { lat: number; lng: number; label: string } | null
  /** Wird beim Klick auf einen Marker gerufen — die Liste springt dann dorthin. */
  onAuswahl?: (id: string) => void
}

/** Adresse ohne Protokoll und ohne Schrägstrich am Ende — das liest sich besser. */
const webseiteBeschriften = (adresse: string): string =>
  adresse.replace(/^https?:\/\//i, '').replace(/\/+$/, '')

/** Ein Eintrag im Backend darf „example.de" ohne Protokoll enthalten. */
const webseiteZiel = (adresse: string): string =>
  /^https?:\/\//i.test(adresse) ? adresse : `https://${adresse}`

export const HaendlerKarte = ({ haendler, standort, onAuswahl }: Props) => {
  const [karte, setKarte] = useState<Kartendaten | null>(null)
  const [fehler, setFehler] = useState(false)
  const [aktiv, setAktiv] = useState<string | null>(null)
  const geladen = useRef(false)

  /* Die Hover-Karte enthält einen Link. Ohne Nachlauf wäre er unerreichbar: Der
     Zeiger verlässt den Marker, bevor er die Karte erreicht, und sie wäre schon
     wieder zu. Deshalb schließt sie verzögert, und wer die Karte selbst betritt,
     bricht das Schließen ab. */
  const schliessen = useRef<number | null>(null)
  const zeigen = (id: string) => {
    if (schliessen.current !== null) window.clearTimeout(schliessen.current)
    schliessen.current = null
    setAktiv(id)
  }
  const spaeterSchliessen = () => {
    if (schliessen.current !== null) window.clearTimeout(schliessen.current)
    schliessen.current = window.setTimeout(() => setAktiv(null), 180)
  }
  useEffect(() => () => {
    if (schliessen.current !== null) window.clearTimeout(schliessen.current)
  }, [])

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
      .map((h) => {
        const { x, y } = projizieren(karte, h.lat as number, h.lng as number)
        return {
          ...h,
          x,
          y,
          /* Anteilig, damit die Hover-Karte als normales HTML über dem SVG sitzt
             und in jeder Breite mitwandert. */
          links: (x / karte.breite) * 100,
          oben: (y / karte.hoehe) * 100,
        }
      })
  }, [karte, haendler])

  const eigenerPunkt = useMemo(() => {
    if (!karte || !standort) return null
    if (!imAusschnitt(karte, standort.lat, standort.lng)) return null
    return { ...projizieren(karte, standort.lat, standort.lng), label: standort.label }
  }, [karte, standort])

  const offen = punkte.find((p) => p.id === aktiv) ?? null

  if (fehler) return null
  if (!karte) return <div className="haendler-karte haendler-karte--laedt" aria-hidden="true" />

  /* Oben am Rand klappt die Karte nach unten, sonst stünde sie außerhalb des
     Bildes. Links und rechts am Rand rückt sie an die jeweilige Kante. */
  const unten = offen ? offen.oben < 34 : false
  const seite = offen ? (offen.links < 26 ? 'links' : offen.links > 74 ? 'rechts' : 'mitte') : 'mitte'

  return (
    <figure className="haendler-karte">
      <div className="haendler-karte__buehne">
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

          {punkte.map((p) => {
            /* Die Beschriftung trägt dieselben Angaben wie die Hover-Karte —
               die ist für Vorlesesoftware ausgeblendet, weil ihr Link außerhalb
               der Tab-Reihenfolge liegt. Vollständig bedienbar ist der Eintrag
               in der Liste darunter. */
            const arten = [...(p.status ?? []).map((s) => STATUS_LABEL[s] ?? s), p.statusFreitext]
              .filter(Boolean)
              .join(', ')
            const beschriftung = [
              p.name,
              [p.postalCode, p.city].filter(Boolean).join(' '),
              arten,
              typeof p.distanz === 'number' ? `${Math.round(p.distanz)} Kilometer entfernt` : '',
            ]
              .filter(Boolean)
              .join(', ')

            return (
              <g
                key={p.id}
                className={`haendler-karte__marker${aktiv === p.id ? ' haendler-karte__marker--aktiv' : ''}${
                  p.featured ? ' haendler-karte__marker--hervor' : ''
                }`}
                transform={`translate(${p.x} ${p.y})`}
                tabIndex={0}
                role="button"
                aria-label={beschriftung}
                onMouseEnter={() => zeigen(p.id)}
                onMouseLeave={spaeterSchliessen}
                onFocus={() => zeigen(p.id)}
                onBlur={spaeterSchliessen}
                onClick={() => onAuswahl?.(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onAuswahl?.(p.id)
                  }
                  if (e.key === 'Escape') setAktiv(null)
                }}
              >
                {/* Tropfenform: Spitze sitzt genau auf dem Ort, Kreis darüber. */}
                <path d="M0 0 L-9 -14 A10.5 10.5 0 1 1 9 -14 Z" className="haendler-karte__nadel" />
                <circle cx={0} cy={-20} r={4.2} className="haendler-karte__punkt" />
              </g>
            )
          })}
        </svg>

        {offen ? (
          <div
            className={`haendler-karte__info haendler-karte__info--${seite}${
              unten ? ' haendler-karte__info--unten' : ''
            }`}
            style={{ left: `${offen.links}%`, top: `${offen.oben}%` }}
            aria-hidden="true"
            onMouseEnter={() => zeigen(offen.id)}
            onMouseLeave={spaeterSchliessen}
          >
            <p className="haendler-karte__info-name">{offen.name}</p>

            {offen.street || offen.postalCode || offen.city ? (
              <p className="haendler-karte__info-ort">
                {offen.street ? (
                  <>
                    {offen.street}
                    <br />
                  </>
                ) : null}
                {[offen.postalCode, offen.city].filter(Boolean).join(' ')}
              </p>
            ) : null}

            {(offen.status ?? []).length > 0 || offen.statusFreitext ? (
              <p className="haendler-karte__info-arten">
                {(offen.status ?? []).map((s) => (
                  <span key={s} className="haendler-karte__info-art">
                    {STATUS_LABEL[s] ?? s}
                  </span>
                ))}
                {offen.statusFreitext ? (
                  <span className="haendler-karte__info-art haendler-karte__info-art--frei">
                    {offen.statusFreitext}
                  </span>
                ) : null}
              </p>
            ) : null}

            {offen.website ? (
              <a
                className="haendler-karte__info-link"
                href={webseiteZiel(offen.website)}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={-1}
              >
                {webseiteBeschriften(offen.website)}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <figcaption>
        {punkte.length === haendler.length
          ? `${punkte.length} ${punkte.length === 1 ? 'Partner' : 'Partner'} auf der Karte`
          : `${punkte.length} von ${haendler.length} Partnern auf der Karte — bei den übrigen fehlen die Koordinaten`}
      </figcaption>
    </figure>
  )
}
