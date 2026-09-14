'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconArrow, IconCheck, IconMail, IconPhone, IconPin } from './Icons'
import {
  codeSuchen,
  entfernung,
  geoAuswerten,
  LAENDER,
  normalisieren,
  type GeoDaten,
  type GeoRoh,
} from '../lib/geo'

export type Haendler = {
  id: string
  name: string
  status: string[]
  statusFreitext?: string | null
  street?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  contactPerson?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  openingHours?: string | null
  services?: string[]
  description?: string | null
  logo?: string | null
  featured?: boolean
  lat?: number | null
  lng?: number | null
}

const STATUS_LABEL: Record<string, string> = {
  haendler: 'Händler',
  einbaupartner: 'Einbaupartner',
}

const SERVICE_LABEL: Record<string, string> = {
  beratung: 'Beratung',
  einbau: 'Einbau',
  werkstatt: 'Werkstatt',
  abholung: 'Abholung möglich',
  vorort: 'Vor-Ort-Service',
}

const RADIEN = [25, 50, 100, 200]

const telHref = (v?: string | null) => (v ? `tel:${v.replace(/[^+\d]/g, '')}` : undefined)

export const HaendlerSuche = ({ haendler }: { haendler: Haendler[] }) => {
  const [suche, setSuche] = useState('')
  const [radius, setRadius] = useState<number | 'alle'>(100)
  const [statusFilter, setStatusFilter] = useState<string>('alle')
  const [standort, setStandort] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [geo, setGeo] = useState<GeoDaten | null>(null)
  const [laden, setLaden] = useState(false)
  const [hinweis, setHinweis] = useState<string | null>(null)
  const geoAngefragt = useRef(false)

  /* Die Geotabelle wird erst gebraucht, wenn jemand wirklich sucht. */
  const geoLaden = useCallback(async (): Promise<GeoDaten | null> => {
    if (geo) return geo
    if (geoAngefragt.current) return null
    geoAngefragt.current = true
    setLaden(true)
    try {
      const antwort = await fetch('/daten/geo.json')
      if (!antwort.ok) throw new Error('nicht erreichbar')
      const daten = geoAuswerten((await antwort.json()) as GeoRoh)
      setGeo(daten)
      return daten
    } catch {
      setHinweis('Die Ortsdaten konnten nicht geladen werden. Die Liste zeigt weiterhin alle Partner.')
      return null
    } finally {
      setLaden(false)
    }
  }, [geo])

  /* Sucheingabe zu Koordinaten auflösen: erst Postleitzahl, dann Ortsname. */
  useEffect(() => {
    const eingabe = suche.trim()
    if (eingabe.length < 3) {
      setStandort(null)
      setHinweis(null)
      return
    }

    let abgebrochen = false
    const aufloesen = async () => {
      const daten = geo ?? (await geoLaden())
      if (!daten || abgebrochen) return

      if (/^\d{4,5}$/.test(eingabe)) {
        const treffer = codeSuchen(daten, eingabe)
        if (treffer) {
          setStandort({
            lat: treffer.lat,
            lng: treffer.lng,
            label: treffer.land === 'DE' ? eingabe : `${eingabe} (${treffer.land})`,
          })
          setHinweis(null)
        } else {
          setStandort(null)
          setHinweis(`Zur Postleitzahl ${eingabe} liegt uns kein Ort vor. Versuch es mit dem Ortsnamen.`)
        }
        return
      }

      const gesucht = normalisieren(eingabe)
      const ort =
        daten.orte.find((o) => normalisieren(o.name) === gesucht) ??
        daten.orte.find((o) => normalisieren(o.name).startsWith(gesucht))
      if (ort) {
        setStandort({
          lat: ort.lat,
          lng: ort.lng,
          label: ort.land === 0 ? ort.name : `${ort.name} (${LAENDER[ort.land]})`,
        })
        setHinweis(null)
      } else {
        setStandort(null)
        setHinweis(`„${eingabe}“ konnten wir nicht zuordnen. Postleitzahl oder Ortsname eingeben.`)
      }
    }

    const zeit = window.setTimeout(aufloesen, 250)
    return () => {
      abgebrochen = true
      window.clearTimeout(zeit)
    }
  }, [suche, geo, geoLaden])

  const standortErmitteln = () => {
    if (!navigator.geolocation) {
      setHinweis('Dein Browser gibt den Standort nicht preis. Gib bitte eine Postleitzahl ein.')
      return
    }
    setLaden(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStandort({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'dein Standort' })
        setSuche('')
        setHinweis(null)
        setLaden(false)
      },
      () => {
        setHinweis('Der Standort wurde nicht freigegeben. Gib bitte eine Postleitzahl ein.')
        setLaden(false)
      },
      { timeout: 8000 },
    )
  }

  /* Alle vorkommenden Status, auch die frei eingetragenen. */
  const statusListe = useMemo(() => {
    const gesehen = new Map<string, string>()
    for (const h of haendler) {
      for (const s of h.status ?? []) gesehen.set(s, STATUS_LABEL[s] ?? s)
      if (h.statusFreitext) gesehen.set(`frei:${h.statusFreitext}`, h.statusFreitext)
    }
    return [...gesehen.entries()]
  }, [haendler])

  const ergebnis = useMemo(() => {
    let liste = haendler.map((h) => ({
      ...h,
      distanz:
        standort && typeof h.lat === 'number' && typeof h.lng === 'number'
          ? entfernung(standort.lat, standort.lng, h.lat, h.lng)
          : null,
    }))

    if (statusFilter !== 'alle') {
      liste = liste.filter((h) =>
        statusFilter.startsWith('frei:')
          ? h.statusFreitext === statusFilter.slice(5)
          : (h.status ?? []).includes(statusFilter),
      )
    }

    if (standort && radius !== 'alle') {
      liste = liste.filter((h) => h.distanz !== null && h.distanz <= radius)
    }

    liste.sort((a, b) => {
      if (a.distanz !== null && b.distanz !== null) return a.distanz - b.distanz
      if (a.distanz !== null) return -1
      if (b.distanz !== null) return 1
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return a.name.localeCompare(b.name, 'de')
    })

    return liste
  }, [haendler, standort, radius, statusFilter])

  const ohneKoordinaten = haendler.filter((h) => typeof h.lat !== 'number').length

  return (
    <>
      <form className="dealer-suche" onSubmit={(e) => e.preventDefault()} role="search">
        <div className="dealer-suche__feld">
          <label htmlFor="ort-eingabe">Postleitzahl oder Ort</label>
          <input
            id="ort-eingabe"
            type="search"
            inputMode="text"
            autoComplete="postal-code"
            placeholder="z. B. 21449 oder Radbruch"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            list="ort-vorschlaege"
          />
          <datalist id="ort-vorschlaege">
            {geo && suche.length >= 3
              ? geo.orte
                  .filter((o) => normalisieren(o.name).startsWith(normalisieren(suche)))
                  .slice(0, 8)
                  .map((o) => <option key={`${o.land}-${o.name}`} value={o.name} />)
              : null}
          </datalist>
        </div>

        <div className="dealer-suche__feld dealer-suche__feld--schmal">
          <label htmlFor="radius-wahl">Umkreis</label>
          <select
            id="radius-wahl"
            value={String(radius)}
            onChange={(e) => setRadius(e.target.value === 'alle' ? 'alle' : Number(e.target.value))}
          >
            {RADIEN.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
            <option value="alle">Ohne Begrenzung</option>
          </select>
        </div>

        <button type="button" className="btn btn--ghost" onClick={standortErmitteln}>
          <IconPin size={17} />
          Meinen Standort
        </button>
      </form>

      <div className="dealer-filter" role="group" aria-label="Nach Status filtern">
        <button
          type="button"
          className={`chip-filter${statusFilter === 'alle' ? ' chip-filter--aktiv' : ''}`}
          onClick={() => setStatusFilter('alle')}
        >
          Alle ({haendler.length})
        </button>
        {statusListe.map(([wert, label]) => {
          const anzahl = haendler.filter((h) =>
            wert.startsWith('frei:') ? h.statusFreitext === wert.slice(5) : (h.status ?? []).includes(wert),
          ).length
          return (
            <button
              key={wert}
              type="button"
              className={`chip-filter${statusFilter === wert ? ' chip-filter--aktiv' : ''}`}
              onClick={() => setStatusFilter(wert)}
            >
              {label} ({anzahl})
            </button>
          )
        })}
      </div>

      <p className="dealer-status" aria-live="polite">
        {laden ? 'Einen Moment …' : null}
        {!laden && standort ? (
          <>
            <strong>{ergebnis.length}</strong> {ergebnis.length === 1 ? 'Partner' : 'Partner'} im Umkreis von{' '}
            {radius === 'alle' ? 'beliebiger Entfernung' : `${radius} km`} um {standort.label}
          </>
        ) : null}
        {!laden && !standort ? (
          <>
            <strong>{ergebnis.length}</strong> {ergebnis.length === 1 ? 'Partner' : 'Partner'} insgesamt
          </>
        ) : null}
      </p>

      {hinweis ? <div className="notice notice--warn dealer-hinweis">{hinweis}</div> : null}

      {ergebnis.length === 0 ? (
        <div className="empty-state">
          <h2>Kein Partner im gewählten Umkreis</h2>
          <p>Vergrößere den Umkreis oder ruf uns an — wir nennen dir den nächstgelegenen Betrieb.</p>
          <a href="tel:+4936134948420" className="btn">
            Beratung anrufen
            <IconArrow />
          </a>
        </div>
      ) : (
        <div className="dealer-liste">
          {ergebnis.map((h) => {
            const anschrift = [h.street, [h.postalCode, h.city].filter(Boolean).join(' ')]
              .filter(Boolean)
              .join(', ')
            const route = anschrift
              ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${h.name}, ${anschrift}`)}`
              : null

            return (
              <article key={h.id} className={`dealer-karte${h.featured ? ' dealer-karte--hervor' : ''}`}>
                <div className="dealer-karte__kopf">
                  <div>
                    <h3>{h.name}</h3>
                    <div className="dealer-karte__etiketten">
                      {(h.status ?? []).map((s) => (
                        <span key={s} className="badge badge--static">
                          {STATUS_LABEL[s] ?? s}
                        </span>
                      ))}
                      {h.statusFreitext ? (
                        <span className="badge badge--static badge--primary">{h.statusFreitext}</span>
                      ) : null}
                    </div>
                  </div>
                  {h.distanz !== null ? (
                    <span className="dealer-karte__distanz">
                      {h.distanz < 10 ? h.distanz.toFixed(1) : Math.round(h.distanz)} km
                    </span>
                  ) : null}
                </div>

                {h.description ? <p className="dealer-karte__text">{h.description}</p> : null}

                <div className="dealer-karte__daten">
                  {anschrift ? (
                    <p>
                      <IconPin size={16} />
                      <span>
                        {h.street}
                        {h.street ? <br /> : null}
                        {h.postalCode} {h.city}
                      </span>
                    </p>
                  ) : null}
                  {h.contactPerson ? (
                    <p>
                      <IconCheck size={16} />
                      <span>{h.contactPerson}</span>
                    </p>
                  ) : null}
                  {h.phone ? (
                    <p>
                      <IconPhone size={16} />
                      <a href={telHref(h.phone)}>{h.phone}</a>
                    </p>
                  ) : null}
                  {h.email ? (
                    <p>
                      <IconMail size={16} />
                      <a href={`mailto:${h.email}`}>{h.email}</a>
                    </p>
                  ) : null}
                </div>

                {h.openingHours ? (
                  <p className="dealer-karte__zeiten">{h.openingHours}</p>
                ) : null}

                {h.services && h.services.length > 0 ? (
                  <ul className="dealer-karte__leistungen">
                    {h.services.map((s) => (
                      <li key={s}>{SERVICE_LABEL[s] ?? s}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="dealer-karte__aktionen">
                  {h.website ? (
                    <a href={h.website} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--ghost">
                      Webseite
                    </a>
                  ) : null}
                  {route ? (
                    <a href={route} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--ghost">
                      Route planen
                    </a>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {ohneKoordinaten > 0 ? (
        <p className="dealer-fussnote">
          {ohneKoordinaten} {ohneKoordinaten === 1 ? 'Eintrag hat' : 'Einträge haben'} keine Koordinaten und
          {ohneKoordinaten === 1 ? ' erscheint' : ' erscheinen'} nur in der Gesamtliste.
        </p>
      ) : null}
    </>
  )
}
