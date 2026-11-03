import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventsForTeam, getTeamBySlug, getTeams } from '../../../../lib/payload'
import { mediaAlt, mediaUrl } from '../../../../lib/media'
import { RichText } from '../../../../components/RichText'
import { IconArrow, IconMail } from '../../../../components/Icons'
import {
  ergebnisseSortiert,
  fahrzeugTitel,
  gefuellt,
  kommendeTermine,
  listeOderNull,
  teamDatum,
  zusammensetzen,
} from '../../../../lib/teams'
import { ART_LABEL, kommendeFuerTeam, ortZeile, zeitraum } from '../../../../lib/veranstaltungen'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const team = await getTeamBySlug(slug).catch(() => null)
  if (!team) return { title: 'Team nicht gefunden' }

  const fahrer = Array.isArray(team.drivers)
    ? team.drivers.map((f: any) => f?.name).filter(Boolean).join(', ')
    : ''
  const beschreibung = zusammensetzen([
    team.series ? `${team.series}` : null,
    team.location,
    fahrer ? `Fahrer: ${fahrer}` : null,
  ])

  return {
    title: team.teamName,
    description: beschreibung || `${team.teamName} fährt mit Bulltron-Race-Batterien.`,
    alternates: { canonical: `/teams/${team.slug}` },
    openGraph: {
      title: team.teamName,
      description: beschreibung || undefined,
      images: mediaUrl(team.mainImage, 'hero') ? [mediaUrl(team.mainImage, 'hero') as string] : undefined,
    },
  }
}

/**
 * Eine Zeile „Bezeichnung — Wert“, die sich selbst ausblendet, wenn der Wert
 * fehlt. Damit entstehen keine leeren Datenzeilen auf halb ausgefüllten Seiten.
 */
const Datenzeile = ({ label, wert }: { label: string; wert?: React.ReactNode }) => {
  if (!gefuellt(wert)) return null
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{wert}</td>
    </tr>
  )
}

/** Ein Textblock mit Überschrift, der nur erscheint, wenn Text da ist. */
const Textblock = ({ titel, text }: { titel: string; text?: string | null }) => {
  if (!gefuellt(text)) return null
  return (
    <div className="team-block">
      <h4 className="team-block__titel">{titel}</h4>
      {String(text)
        .split(/\n{2,}/)
        .map((absatz, i) => (
          <p key={i}>{absatz}</p>
        ))}
    </div>
  )
}

export default async function TeamDetailPage({ params }: Props) {
  const { slug } = await params
  const team = await getTeamBySlug(slug).catch(() => null)
  if (!team) notFound()

  const fahrer = listeOderNull(team.drivers as any[])
  const fahrzeuge = listeOderNull(team.vehicles as any[])
  const ergebnisse = ergebnisseSortiert(team.results as any[])
  const erfolge = listeOderNull(team.pastAchievements as any[])
  const termine = kommendeTermine(team.upcoming as any[])
  /* Seit dem 03.11.2026 kommen die Termine aus der Sammlung Veranstaltungen:
     dort steht jedes Rennen einmal, mit allen Teams daran. Das Feld am Team
     bleibt als Eingang bestehen — dort landen die Angaben aus dem Fragebogen,
     solange daraus keine Veranstaltung geworden ist. Beide Listen erscheinen
     zusammen, nach Datum sortiert; die aus der Sammlung führen auf ihre
     eigene Seite. */
  const veranstaltungen = kommendeFuerTeam((await getEventsForTeam(team.id).catch(() => [])) as never[])
  const kalender = [
    ...veranstaltungen.map((v: any) => ({
      schluessel: `v${v.id}`,
      zeit: new Date(v.dateFrom).getTime(),
      zeitraum: zeitraum(v),
      art: ART_LABEL[v.kind] ?? ART_LABEL.sonstiges,
      titel: v.title,
      meta: [v.series, ortZeile(v)].filter(Boolean).join(' \u00b7 '),
      href: `/veranstaltungen/${v.slug}`,
      extern: null as string | null,
    })),
    ...termine.map((t: any, i: number) => ({
      schluessel: `t${i}`,
      zeit: new Date(t.date).getTime(),
      zeitraum: teamDatum(t.date),
      art: 'Termin',
      titel: t.event,
      meta: gefuellt(t.track) ? t.track : '',
      href: null as string | null,
      extern: gefuellt(t.url) ? (t.url as string) : null,
    })),
  ].sort((a, b) => a.zeit - b.zeit)
  const galerie = listeOderNull(team.gallery as any[])
  const links = listeOderNull(team.social as any[])
  const heroBild = mediaUrl(team.mainImage, 'hero')
  const logo = mediaUrl(team.logo, 'thumbnail')
  const untertitel = zusammensetzen([team.series, team.location])
  const kontaktSichtbar = team.contactPublic === true && (gefuellt(team.contactName) || gefuellt(team.contactEmail))
  /* Die linke Spalte trägt Vorstellung und Links. Fehlt beides, wäre sie leer
     und die rechte Spalte stünde neben einer Lücke — dann wird einspaltig
     gesetzt. */
  const hatVorstellung = gefuellt(team.intro) || gefuellt(team.website) || Boolean(links)
  const hatNebenspalte = Boolean(fahrer) || kontaktSichtbar

  return (
    <>
      <section className={`page-hero${heroBild ? ' page-hero--foto' : ''}`}>
        {heroBild ? (
          <>
            <img className="page-hero__bg" src={heroBild} alt={mediaAlt(team.mainImage, team.teamName)} />
            <div className="page-hero__scrim" />
          </>
        ) : (
          <>
            <div className="stripes" />
            <div className="glow glow--primary" style={{ width: 420, height: 420, top: '-30%', right: '4%' }} />
          </>
        )}
        <div className="container">
          <div className="page-hero__text">
            <span className="eyebrow">Im Renneinsatz</span>
            <div className="team-kopf">
              {logo ? <img className="team-kopf__logo" src={logo} alt={mediaAlt(team.logo, team.teamName)} /> : null}
              <h1 className="h-lg">{team.teamName}</h1>
            </div>
            {untertitel ? (
              <p className="lead" style={{ marginTop: '0.9rem' }}>
                {untertitel}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Start</Link>
          <span>/</span>
          <Link href="/teams">Teams</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-soft)' }}>{team.teamName}</span>
        </nav>
      </div>

      {/* ------------------------------------------------ Team und Fahrer -- */}
      {hatVorstellung || hatNebenspalte ? (
        <section className="section section--tight">
          <div className="container">
            <div className={`team-spalten${hatVorstellung && hatNebenspalte ? '' : ' team-spalten--einspaltig'}`}>
              {hatVorstellung ? (
              <div>
                {gefuellt(team.intro) ? (
                  <>
                    <span className="eyebrow">Das Team</span>
                    <RichText data={team.intro} />
                  </>
                ) : null}

                {gefuellt(team.website) || links ? (
                  <div className="btn-row" style={{ marginTop: '1.6rem' }}>
                    {gefuellt(team.website) ? (
                      <a href={team.website as string} className="btn btn--ghost btn--sm" target="_blank" rel="noopener noreferrer">
                        Webseite
                        <IconArrow />
                      </a>
                    ) : null}
                    {links?.map((link: any, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        className="btn btn--ghost btn--sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              ) : null}

              {hatNebenspalte ? (
              <div>
                {fahrer ? (
                  <div className="team-fahrer">
                    <h2 className="h-sm" style={{ marginBottom: '1.1rem' }}>
                      {fahrer.length === 1 ? 'Fahrer' : 'Fahrer'}
                    </h2>
                    <ul className="team-fahrer__liste">
                      {fahrer.map((f: any, i: number) => {
                        const foto = mediaUrl(f.photo, 'thumbnail')
                        return (
                          <li className="team-fahrer__eintrag" key={i}>
                            {foto ? (
                              <img src={foto} alt={mediaAlt(f.photo, f.name)} className="team-fahrer__foto" />
                            ) : (
                              <span className="team-fahrer__foto team-fahrer__foto--leer" aria-hidden="true">
                                {String(f.name ?? '?').slice(0, 1).toUpperCase()}
                              </span>
                            )}
                            <span>
                              <strong>{f.name}</strong>
                              {gefuellt(f.role) ? <span className="team-fahrer__rolle">{f.role}</span> : null}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}

                {kontaktSichtbar ? (
                  <div className="team-kontakt">
                    <h3 className="team-block__titel">Ansprechpartner</h3>
                    {gefuellt(team.contactName) ? <p>{team.contactName}</p> : null}
                    {gefuellt(team.contactEmail) ? (
                      <a href={`mailto:${team.contactEmail}`} className="link-arrow">
                        <IconMail size={16} />
                        {team.contactEmail}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ Fahrzeuge -------- */}
      {fahrzeuge ? (
        <section className="section section--alt section--tight">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Technik</span>
              <h2 className="h-md">{fahrzeuge.length === 1 ? 'Fahrzeug und Batterie' : 'Fahrzeuge und Batterien'}</h2>
            </div>

            <div className="stack">
              {fahrzeuge.map((v: any, i: number) => {
                const foto = mediaUrl(v.photo, 'card')
                const batterie = v.battery && typeof v.battery === 'object' ? v.battery : null
                const batterieText = batterie ? null : v.batteryOther

                return (
                  <article className="team-fahrzeug" key={i}>
                    {foto ? (
                      <div className="team-fahrzeug__media">
                        <img src={foto} alt={mediaAlt(v.photo, fahrzeugTitel(v))} loading="lazy" />
                      </div>
                    ) : null}

                    <div className="team-fahrzeug__body">
                      <h3 className="h-sm">{fahrzeugTitel(v)}</h3>

                      <div className="table-wrap">
                        <table className="table-specs">
                          <tbody>
                            <Datenzeile label="Fahrer" wert={v.driver} />
                            <Datenzeile label="Motor / Hubraum / Leistung" wert={v.engine} />
                            <Datenzeile label="Besonderheiten und Umbauten" wert={v.modifications} />
                            <Datenzeile
                              label="Bulltron-Batterie"
                              wert={
                                batterie ? (
                                  <Link href={`/produkte/${batterie.slug}`}>{batterie.title}</Link>
                                ) : (
                                  batterieText
                                )
                              }
                            />
                            <Datenzeile label="Im Einsatz seit" wert={v.since} />
                          </tbody>
                        </table>
                      </div>

                      <Textblock titel="Warum Bulltron" text={v.reason} />
                      <Textblock titel="Erfahrungen im Rennbetrieb" text={v.experience} />
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ Erfolge ---------- */}
      {ergebnisse.length > 0 || erfolge ? (
        <section className="section section--tight">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Bilanz</span>
              <h2 className="h-md">Erfolge</h2>
            </div>

            <div className="grid grid--2">
              {ergebnisse.length > 0 ? (
                <div>
                  <h3 className="team-block__titel">Aktuelle Saison</h3>
                  <ul className="team-liste">
                    {ergebnisse.map((e: any, i: number) => (
                      <li key={i}>
                        {gefuellt(e.placement) ? <span className="team-liste__marke">{e.placement}</span> : null}
                        <span>
                          <strong>{e.event}</strong>
                          {gefuellt(e.date) ? <span className="team-liste__meta">{teamDatum(e.date)}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {erfolge ? (
                <div>
                  <h3 className="team-block__titel">Aus vergangenen Jahren</h3>
                  <ul className="team-liste">
                    {erfolge.map((e: any, i: number) => (
                      <li key={i}>
                        {gefuellt(e.year) ? <span className="team-liste__marke">{e.year}</span> : null}
                        <span>
                          <strong>{e.title}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ Termine ---------- */}
      {kalender.length > 0 ? (
        <section className="section section--alt section--tight">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Kalender</span>
              <h2 className="h-md">Kommende Renntermine</h2>
            </div>

            <div className="termin-liste">
              {kalender.map((k) => (
                <article className="termin" key={k.schluessel}>
                  <div className="termin__datum">
                    <span className="termin__zeitraum">{k.zeitraum}</span>
                    <span className="termin__art">{k.art}</span>
                  </div>
                  <div className="termin__body">
                    <h3 className="termin__titel">
                      {k.href ? (
                        <Link href={k.href}>{k.titel}</Link>
                      ) : k.extern ? (
                        <a href={k.extern} target="_blank" rel="noopener noreferrer">
                          {k.titel}
                        </a>
                      ) : (
                        k.titel
                      )}
                    </h3>
                    {k.meta ? <p className="termin__meta">{k.meta}</p> : null}
                  </div>
                  {k.href ? (
                    <Link href={k.href} className="link-arrow termin__mehr">
                      Details <IconArrow />
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ Galerie ---------- */}
      {galerie ? (
        <section className="section section--tight">
          <div className="container">
            <div className="grid grid--3">
              {galerie.map((g: any, i: number) => {
                const bild = mediaUrl(g.image, 'card')
                if (!bild) return null
                return (
                  <figure className="team-bild" key={i}>
                    <img src={bild} alt={mediaAlt(g.image, team.teamName)} loading="lazy" />
                    {gefuellt(g.caption) ? <figcaption>{g.caption}</figcaption> : null}
                  </figure>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section section--alt section--tight">
        <div className="container">
          <div className="split">
            <div>
              <h2 className="h-md" style={{ marginBottom: '0.8rem' }}>
                Alle Teams
              </h2>
              <p className="lead">Welche Batterie in welchem Fahrzeug steckt — und was damit herauskommt.</p>
            </div>
            <div className="btn-row" style={{ alignItems: 'center' }}>
              <Link href="/teams" className="btn btn--ghost">
                Zur Übersicht
                <IconArrow />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

/** Bekannte Teams vorab bekannt machen, damit die Adressen im Export auftauchen. */
export async function generateStaticParams() {
  const teams = await getTeams().catch(() => [])
  return teams.map((team) => ({ slug: team.slug as string }))
}
