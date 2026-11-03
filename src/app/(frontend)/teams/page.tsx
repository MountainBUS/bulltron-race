import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getEvents, getTeams } from '../../../lib/payload'
import { mediaAlt, mediaUrl } from '../../../lib/media'
import { IconArrow, IconMail, IconPhone } from '../../../components/Icons'
import { ANFRAGE_MAIL, ANFRAGE_TEL } from '../../../lib/shop'
import { kommendeTermine, teamDatum, zusammensetzen } from '../../../lib/teams'
import { naechsteJeTeam, ortZeile, zeitraum } from '../../../lib/veranstaltungen'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Teams und Fahrer',
  description:
    'Rennteams und Fahrer, die mit Bulltron-Race-Batterien antreten: Fahrzeuge, eingesetzte Modelle, Ergebnisse und kommende Renntermine.',
  alternates: { canonical: '/teams' },
}

export default async function TeamsPage() {
  const [teams, events] = await Promise.all([getTeams().catch(() => []), getEvents().catch(() => [])])
  /* Der nächste Termin je Team kommt aus der Sammlung Veranstaltungen; das
     Feld am Team bleibt als zweite Quelle, solange aus einer Fragebogenangabe
     noch keine Veranstaltung geworden ist. */
  const naechsteVeranstaltung = naechsteJeTeam(events as never[])

  let fahrerGesamt = 0
  for (const team of teams) {
    if (Array.isArray(team.drivers)) fahrerGesamt += team.drivers.length
  }
  const naechsterTermin = [
    ...teams.flatMap((team) =>
      kommendeTermine(team.upcoming as never[]).map((t: any) => ({
        zeit: new Date(t.date).getTime(),
        wann: teamDatum(t.date),
        was: t.event,
        wo: t.track as string | null,
        href: null as string | null,
        team,
      })),
    ),
    ...teams.flatMap((team) => {
      const v: any = naechsteVeranstaltung.get(String(team.id))
      if (!v) return []
      return [
        {
          zeit: new Date(v.dateFrom).getTime(),
          wann: zeitraum(v),
          was: v.title as string,
          wo: (ortZeile(v) || null) as string | null,
          href: `/veranstaltungen/${v.slug}` as string | null,
          team,
        },
      ]
    }),
  ].sort((a, b) => a.zeit - b.zeit)[0]

  return (
    <>
      <section className="page-hero">
        <div className="stripes" />
        <div className="glow glow--primary" style={{ width: 420, height: 420, top: '-30%', right: '4%' }} />
        <div className="container">
          <div className="page-hero__inner">
            <div className="page-hero__text">
              <span className="eyebrow">Im Renneinsatz</span>
              <h1 className="h-lg">Teams und Fahrer</h1>
              <p className="lead" style={{ marginTop: '1.1rem' }}>
                Wer mit Bulltron Race an den Start geht, welche Fahrzeuge dabei laufen und was auf der Strecke
                herauskommt. Jedes Team hat eine eigene Seite mit Technik, Ergebnissen und kommenden Terminen.
              </p>
            </div>
            {teams.length > 0 ? (
              <div>
                <div className="stat-strip" style={{ borderTop: 0 }}>
                  <div className="stat" style={{ borderRight: 0 }}>
                    <div className="stat__value">{teams.length}</div>
                    <div className="stat__label">{teams.length === 1 ? 'Team' : 'Teams'}</div>
                  </div>
                  {fahrerGesamt > 0 ? (
                    <div className="stat" style={{ borderRight: 0 }}>
                      <div className="stat__value">{fahrerGesamt}</div>
                      <div className="stat__label">{fahrerGesamt === 1 ? 'Fahrer' : 'Fahrer'}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Start</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-soft)' }}>Teams</span>
        </nav>
      </div>

      {naechsterTermin ? (
        <div className="container">
          <p className="notice notice--info" style={{ marginTop: '1.4rem' }}>
            Nächster Renntermin: {naechsterTermin.wann} —{' '}
            {naechsterTermin.href ? (
              <Link href={naechsterTermin.href}>{naechsterTermin.was}</Link>
            ) : (
              naechsterTermin.was
            )}
            {naechsterTermin.wo ? `, ${naechsterTermin.wo}` : ''} mit{' '}
            <Link href={`/teams/${naechsterTermin.team.slug}`}>{naechsterTermin.team.teamName}</Link>
          </p>
        </div>
      ) : null}

      <section className="section section--tight">
        <div className="container">
          {teams.length === 0 ? (
            <div className="empty-state">
              <p>
                Hier entsteht die Übersicht der Rennteams. Sobald die ersten Fragebögen zurück sind, erscheinen die
                Teams an dieser Stelle.
              </p>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: '1.4rem' }}>
                <a href={ANFRAGE_MAIL} className="btn">
                  <IconMail size={17} />
                  Als Team melden
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid--3">
              {teams.map((team) => {
                const bild = mediaUrl(team.mainImage, 'card')
                const fahrer = Array.isArray(team.drivers) ? team.drivers : []
                const fahrerNamen = fahrer
                  .map((f: any) => f?.name)
                  .filter(Boolean)
                  .join(', ')
                const fahrzeuge = Array.isArray(team.vehicles) ? team.vehicles : []
                const untertitel = zusammensetzen([team.series, team.location])
                const termine = kommendeTermine(team.upcoming as never[])
                /* Der frühere der beiden: die nächste Veranstaltung, an der
                   das Team hängt, oder sein eigener Fragebogen-Termin. */
                const naechsteV: any = naechsteVeranstaltung.get(String(team.id))
                const naechsterStart = [
                  ...(termine.length > 0
                    ? [{ zeit: new Date((termine[0] as any).date).getTime(), wann: teamDatum((termine[0] as any).date), was: (termine[0] as any).event as string }]
                    : []),
                  ...(naechsteV
                    ? [{ zeit: new Date(naechsteV.dateFrom).getTime(), wann: zeitraum(naechsteV), was: naechsteV.title as string }]
                    : []),
                ].sort((a, b) => a.zeit - b.zeit)[0]

                return (
                  <article
                    className={`team-karte${team.featured ? ' team-karte--hervor' : ''}`}
                    key={team.id}
                  >
                    <Link href={`/teams/${team.slug}`} className="team-karte__media" aria-label={team.teamName}>
                      {bild ? (
                        <img src={bild} alt={mediaAlt(team.mainImage, team.teamName)} loading="lazy" />
                      ) : (
                        <span className="team-karte__platzhalter" aria-hidden="true">
                          {team.teamName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </Link>

                    <div className="team-karte__body">
                      <h2 className="team-karte__titel">
                        <Link href={`/teams/${team.slug}`}>{team.teamName}</Link>
                      </h2>

                      {untertitel ? <p className="team-karte__sub">{untertitel}</p> : null}

                      {fahrerNamen ? (
                        <p className="team-karte__fahrer">
                          <span className="team-karte__label">
                            {fahrer.length === 1 ? 'Fahrer' : 'Fahrer'}
                          </span>
                          {fahrerNamen}
                        </p>
                      ) : null}

                      {fahrzeuge.length > 0 ? (
                        <p className="team-karte__fahrer">
                          <span className="team-karte__label">
                            {fahrzeuge.length === 1 ? 'Fahrzeug' : 'Fahrzeuge'}
                          </span>
                          {fahrzeuge
                            .map((v: any) => zusammensetzen([v?.manufacturer, v?.model], ' '))
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      ) : null}

                      {naechsterStart ? (
                        <p className="team-karte__termin">
                          Nächster Start: {naechsterStart.wann}
                          {naechsterStart.was ? ` — ${naechsterStart.was}` : ''}
                        </p>
                      ) : null}

                      <Link href={`/teams/${team.slug}`} className="link-arrow">
                        Team ansehen
                        <IconArrow />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section section--alt section--tight">
        <div className="container">
          <div className="split">
            <div>
              <span className="eyebrow">Mitmachen</span>
              <h2 className="h-md" style={{ marginBottom: '1rem' }}>
                Ihr fahrt mit Bulltron Race?
              </h2>
              <p className="lead">
                Dann gehört ihr auf diese Seite. Schreibt uns kurz, wer ihr seid, welches Fahrzeug ihr einsetzt und
                welche Batterie darin steckt — den Rest klären wir am Telefon.
              </p>
            </div>
            <div className="btn-row" style={{ alignItems: 'center' }}>
              <a href={ANFRAGE_MAIL} className="btn">
                <IconMail size={17} />
                E-Mail schreiben
                <IconArrow />
              </a>
              <a href={ANFRAGE_TEL} className="btn btn--ghost">
                <IconPhone size={17} />
                Anrufen
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
