'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Event } from '../payload-types'
import { ART_LABEL, nachMonat, ortZeile, teilnehmer, zeitraum } from '../lib/veranstaltungen'
import { IconArrow } from './Icons'

/**
 * Die Liste der Veranstaltungen mit den Filter-Chips darüber.
 *
 * Warum im Browser und nicht auf dem Server: Die Chips sollen ohne Neuladen
 * umschalten, und die Datenmenge ist winzig — ein bis zwei Dutzend Termine im
 * Jahr. Die Aufteilung in kommend und vergangen trifft der Server, damit „was
 * ist vorbei" an genau einer Stelle entschieden wird.
 */

type Filter = 'alle' | 'bulltron' | 'teams' | 'messe'

const FILTER: Array<{ wert: Filter; label: string }> = [
  { wert: 'alle', label: 'Alle' },
  { wert: 'bulltron', label: 'Bulltron vor Ort' },
  { wert: 'teams', label: 'Mit unseren Teams' },
  { wert: 'messe', label: 'Messen' },
]

const passt = (v: Event, filter: Filter): boolean => {
  if (filter === 'alle') return true
  if (filter === 'bulltron') return Boolean(v.bulltron?.present)
  if (filter === 'teams') return teilnehmer(v).length > 0
  return v.kind === 'messe'
}

const Karte = ({ v }: { v: Event }) => {
  const teams = teilnehmer(v)
  const ort = ortZeile(v)
  return (
    <article className={`termin${v.featured ? ' termin--hervor' : ''}${v.canceled ? ' termin--abgesagt' : ''}`}>
      <div className="termin__datum">
        <span className="termin__zeitraum">{zeitraum(v)}</span>
        <span className="termin__art">{ART_LABEL[v.kind] ?? ART_LABEL.sonstiges}</span>
      </div>

      <div className="termin__body">
        <h3 className="termin__titel">
          <Link href={`/veranstaltungen/${v.slug}`}>{v.title}</Link>
        </h3>
        {v.series || ort ? (
          <p className="termin__meta">{[v.series, ort].filter(Boolean).join(' · ')}</p>
        ) : null}

        <div className="termin__etiketten">
          {v.canceled ? <span className="badge badge--static">Abgesagt</span> : null}
          {v.bulltron?.present ? <span className="badge badge--static badge--primary">Bulltron Race vor Ort</span> : null}
          {teams.map(({ team, note }) => (
            <span className="badge badge--static" key={String(team.id)}>
              {team.teamName}
              {note ? ` — ${note}` : ''}
            </span>
          ))}
        </div>
      </div>

      <Link href={`/veranstaltungen/${v.slug}`} className="link-arrow termin__mehr" aria-label={`${v.title} ansehen`}>
        Details <IconArrow />
      </Link>
    </article>
  )
}

export const VeranstaltungsListe = ({ kommend, vergangen }: { kommend: Event[]; vergangen: Event[] }) => {
  const [filter, setFilter] = useState<Filter>('alle')
  const [archivOffen, setArchivOffen] = useState(false)

  /* Die Zahlen an den Chips zählen die kommenden Termine — dieselbe Menge,
     die oben als „x Termine" steht und unter den Chips erscheint. Der
     Rückblick nennt seine eigene Zahl auf dem Schalter. */
  const gefilterteKommend = useMemo(() => kommend.filter((v) => passt(v, filter)), [kommend, filter])
  const gefilterteVergangen = useMemo(() => vergangen.filter((v) => passt(v, filter)), [vergangen, filter])
  const gruppen = useMemo(() => nachMonat(gefilterteKommend), [gefilterteKommend])

  return (
    <>
      <div className="dealer-filter" role="group" aria-label="Veranstaltungen filtern">
        {FILTER.map(({ wert, label }) => {
          const anzahl = kommend.filter((v) => passt(v, wert)).length
          return (
            <button
              key={wert}
              type="button"
              className={`chip-filter${filter === wert ? ' chip-filter--aktiv' : ''}`}
              onClick={() => setFilter(wert)}
            >
              {label} ({anzahl})
            </button>
          )
        })}
      </div>

      {gefilterteKommend.length > 0 ? (
        gruppen.map((gruppe) => (
          <section className="termin-monat" key={gruppe.titel}>
            <h2 className="termin-monat__titel">{gruppe.titel}</h2>
            <div className="termin-liste">
              {gruppe.eintraege.map((v) => (
                <Karte v={v} key={v.id} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="empty-state">
          {kommend.length === 0
            ? 'Zurzeit steht kein Termin an. Sobald der nächste feststeht, steht er hier.'
            : 'Zu diesem Filter steht kein Termin an. Weiter unten stehen die vergangenen Veranstaltungen.'}
        </div>
      )}

      {gefilterteVergangen.length > 0 ? (
        <section className="termin-archiv">
          <button
            type="button"
            className="termin-archiv__schalter"
            onClick={() => setArchivOffen((o) => !o)}
            aria-expanded={archivOffen}
          >
            {archivOffen ? 'Rückblick einklappen' : `Rückblick: ${gefilterteVergangen.length} vergangene ${gefilterteVergangen.length === 1 ? 'Veranstaltung' : 'Veranstaltungen'}`}
          </button>
          {archivOffen ? (
            <div className="termin-liste termin-liste--archiv">
              {gefilterteVergangen.map((v) => (
                <Karte v={v} key={v.id} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  )
}
