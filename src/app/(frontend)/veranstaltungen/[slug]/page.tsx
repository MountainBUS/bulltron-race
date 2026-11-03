import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getEvents } from '../../../../lib/payload'
import { mediaAlt, mediaUrl } from '../../../../lib/media'
import { RichText } from '../../../../components/RichText'
import { IconArrow } from '../../../../components/Icons'
import { gefuellt, listeOderNull } from '../../../../lib/teams'
import { ART_LABEL, istVorbei, LAND_LABEL, ortZeile, teilnehmer, zeitraum } from '../../../../lib/veranstaltungen'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const v = await getEventBySlug(slug).catch(() => null)
  if (!v) return { title: 'Veranstaltung nicht gefunden' }

  const beschreibung =
    v.shortDescription ||
    [zeitraum(v as never), v.series, ortZeile(v as never)].filter(Boolean).join(' · ') ||
    undefined

  return {
    title: v.title,
    description: beschreibung,
    alternates: { canonical: `/veranstaltungen/${v.slug}` },
    openGraph: {
      title: v.title,
      description: beschreibung,
      images: mediaUrl(v.mainImage, 'hero') ? [mediaUrl(v.mainImage, 'hero') as string] : undefined,
    },
  }
}

/** Eine Zeile „Bezeichnung — Wert“, die sich bei leerem Wert selbst ausblendet. */
const Datenzeile = ({ label, wert }: { label: string; wert?: React.ReactNode }) => {
  if (!gefuellt(wert)) return null
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{wert}</td>
    </tr>
  )
}

export default async function VeranstaltungPage({ params }: Props) {
  const { slug } = await params
  const v = await getEventBySlug(slug).catch(() => null)
  if (!v) notFound()

  const vorbei = istVorbei(v as never)
  const teams = teilnehmer(v as never)
  const bild = mediaUrl(v.mainImage, 'hero')
  const galerie = listeOderNull((v.gallery ?? []).filter((g: any) => g?.image))
  const land = v.country && v.country !== 'DE' ? LAND_LABEL[v.country] : null

  /* Andere Termine für den Fuß der Seite: dieselbe Serie zuerst, sonst
     einfach die nächsten. Ohne das endet die Seite in einer Sackgasse. */
  const alle = await getEvents().catch(() => [])
  const weitere = (alle as any[])
    .filter((a) => a.id !== v.id && !istVorbei(a))
    .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
    .slice(0, 3)

  return (
    <>
      <section className={`page-hero${bild ? ' page-hero--foto' : ''}`}>
        {bild ? (
          <>
            <img className="page-hero__bg" src={bild} alt={mediaAlt(v.mainImage, v.title)} />
            <div className="page-hero__scrim" />
          </>
        ) : (
          <>
            <div className="stripes" />
            <div className="glow glow--primary" style={{ width: 420, height: 420, top: '-30%', right: '4%' }} />
          </>
        )}
        <div className="container">
          <div className="page-hero__inner">
            <div className="page-hero__text">
              <span className="eyebrow">{ART_LABEL[v.kind] ?? ART_LABEL.sonstiges}</span>
              <h1 className="h-lg">{v.title}</h1>
              <p className="lead" style={{ marginTop: '1.1rem' }}>
                {[zeitraum(v as never), ortZeile(v as never)].filter(Boolean).join(' · ')}
              </p>
              <div className="termin__etiketten" style={{ marginTop: '1rem' }}>
                {v.canceled ? <span className="badge badge--static">Abgesagt</span> : null}
                {vorbei && !v.canceled ? <span className="badge badge--static">Vergangen</span> : null}
                {v.bulltron?.present ? <span className="badge badge--static badge--primary">Bulltron Race vor Ort</span> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <nav className="crumbs" aria-label="Brotkrumen">
          <Link href="/">Start</Link>
          <span>/</span>
          <Link href="/veranstaltungen">Veranstaltungen</Link>
          <span>/</span>
          <span>{v.title}</span>
        </nav>
      </div>

      <section className="section">
        <div className="container">
          <div className={`team-spalten${!gefuellt(v.description) && !gefuellt(v.shortDescription) ? ' team-spalten--einspaltig' : ''}`}>
            <div>
              {gefuellt(v.shortDescription) ? <p className="lead">{v.shortDescription}</p> : null}
              {gefuellt(v.description) ? (
                <div style={{ marginTop: '1.2rem' }}>
                  <RichText data={v.description} />
                </div>
              ) : null}

              {v.bulltron?.present ? (
                <div className="notice notice--info" style={{ marginTop: '1.6rem' }}>
                  <strong>Bulltron Race ist vor Ort.</strong>
                  {gefuellt(v.bulltron.location) ? <> Du findest uns hier: {v.bulltron.location}.</> : null}
                  {gefuellt(v.bulltron.contact) ? <> Ansprechpartner: {v.bulltron.contact}.</> : null}
                  {gefuellt(v.bulltron.note) ? <div style={{ marginTop: '0.5rem' }}>{v.bulltron.note}</div> : null}
                </div>
              ) : null}

              {gefuellt(v.website) ? (
                <p style={{ marginTop: '1.4rem' }}>
                  <a className="link-arrow" href={v.website as string} target="_blank" rel="noopener noreferrer">
                    Zur Veranstaltung <IconArrow />
                  </a>
                </p>
              ) : null}
            </div>

            <div>
              <div className="team-block">
                <h2 className="team-block__titel">Termin</h2>
                <div className="table-wrap">
                  <table className="table-specs">
                    <tbody>
                      <Datenzeile label="Datum" wert={zeitraum(v as never)} />
                      <Datenzeile label="Art" wert={ART_LABEL[v.kind] ?? ART_LABEL.sonstiges} />
                      <Datenzeile label="Serie" wert={v.series} />
                      <Datenzeile label="Strecke" wert={v.venue} />
                      <Datenzeile label="Ort" wert={v.city} />
                      <Datenzeile label="Land" wert={land} />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {teams.length > 0 ? (
        <section className="section section--alt">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Am Start</span>
              <h2 className="h-md">{teams.length === 1 ? 'Unser Team' : 'Unsere Teams'}</h2>
            </div>
            <div className="grid grid--3">
              {teams.map(({ team, note, result }) => {
                const logo = mediaUrl(team.mainImage ?? team.logo, 'card')
                return (
                  <article className="team-karte" key={String(team.id)}>
                    <Link href={`/teams/${team.slug}`} className="team-karte__media" aria-label={team.teamName}>
                      {logo ? (
                        <img src={logo} alt={mediaAlt(team.mainImage ?? team.logo, team.teamName)} loading="lazy" />
                      ) : (
                        <span className="team-karte__platzhalter">{String(team.teamName ?? '').slice(0, 2)}</span>
                      )}
                    </Link>
                    <div className="team-karte__body">
                      <h3 className="team-karte__titel">
                        <Link href={`/teams/${team.slug}`}>{team.teamName}</Link>
                      </h3>
                      {note ? <p className="team-karte__sub">{note}</p> : null}
                      {result ? <p className="team-karte__termin">Ergebnis: {result}</p> : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {galerie ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Bilder</span>
              <h2 className="h-md">Eindrücke</h2>
            </div>
            <div className="grid grid--3">
              {galerie.map((g: any, i: number) => (
                <figure className="team-bild" key={i}>
                  <img src={mediaUrl(g.image, 'card') ?? ''} alt={mediaAlt(g.image, v.title)} loading="lazy" />
                  {g.caption ? <figcaption>{g.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {weitere.length > 0 ? (
        <section className="section section--alt">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Kalender</span>
              <h2 className="h-md">Als Nächstes</h2>
            </div>
            <div className="termin-liste">
              {weitere.map((a: any) => (
                <article className="termin" key={a.id}>
                  <div className="termin__datum">
                    <span className="termin__zeitraum">{zeitraum(a)}</span>
                    <span className="termin__art">{ART_LABEL[a.kind] ?? ART_LABEL.sonstiges}</span>
                  </div>
                  <div className="termin__body">
                    <h3 className="termin__titel">
                      <Link href={`/veranstaltungen/${a.slug}`}>{a.title}</Link>
                    </h3>
                    {a.series || ortZeile(a) ? (
                      <p className="termin__meta">{[a.series, ortZeile(a)].filter(Boolean).join(' · ')}</p>
                    ) : null}
                  </div>
                  <Link href={`/veranstaltungen/${a.slug}`} className="link-arrow termin__mehr">
                    Details <IconArrow />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
