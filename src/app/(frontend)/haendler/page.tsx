import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayloadClient } from '../../../lib/payload'
import { mediaUrl } from '../../../lib/media'
import { HaendlerSuche, type Haendler } from '../../../components/HaendlerSuche'
import { IconArrow, IconMail, IconPhone } from '../../../components/Icons'
import { ANFRAGE_MAIL, ANFRAGE_TEL } from '../../../lib/shop'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Händler und Einbaupartner',
  description:
    'Bulltron-Race-Händler und Einbaupartner in deiner Nähe finden: Umkreissuche nach Postleitzahl oder Ort, Filter nach Händler und Einbaupartner.',
  alternates: { canonical: '/haendler' },
}

/**
 * Die Partnerliste wird komplett an den Browser übergeben. Die Umkreissuche
 * rechnet dort — das funktioniert auch im statischen Export und schickt keine
 * Adresse oder Position an einen fremden Dienst.
 */
const haendlerLaden = async (): Promise<Haendler[]> => {
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'dealers',
      where: { published: { equals: true } },
      limit: 500,
      sort: 'name',
      depth: 1,
    })

    return res.docs.map((d: Record<string, any>) => ({
      id: String(d.id),
      name: d.name,
      status: Array.isArray(d.status) ? d.status : d.status ? [d.status] : [],
      statusFreitext: d.statusFreitext ?? null,
      street: d.street ?? null,
      postalCode: d.postalCode ?? null,
      city: d.city ?? null,
      country: d.country ?? 'DE',
      contactPerson: d.contactPerson ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      website: d.website ?? null,
      openingHours: d.openingHours ?? null,
      services: Array.isArray(d.services) ? d.services : [],
      description: d.description ?? null,
      logo: mediaUrl(d.logo, 'thumbnail'),
      featured: Boolean(d.featured),
      lat: typeof d.coordinates?.lat === 'number' ? d.coordinates.lat : null,
      lng: typeof d.coordinates?.lng === 'number' ? d.coordinates.lng : null,
      // internalNote wird bewusst nicht übergeben — das ist eine reine Backendnotiz.
    }))
  } catch {
    // Beim Build kann die Datenbank noch leer sein. Dann bleibt die Seite leer,
    // statt den ganzen Build scheitern zu lassen.
    return []
  }
}

export default async function HaendlerPage() {
  const haendler = await haendlerLaden()
  const einbaupartner = haendler.filter((h) => h.status.includes('einbaupartner')).length

  return (
    <>
      <section className="page-hero">
        <div className="stripes" />
        <div className="glow glow--primary" style={{ width: 420, height: 420, top: '-30%', right: '4%' }} />
        <div className="container">
          <div className="page-hero__inner">
            <div className="page-hero__text">
              <span className="eyebrow">Partnernetz</span>
              <h1 className="h-lg">Händler und Einbaupartner</h1>
              <p className="lead" style={{ marginTop: '1.1rem' }}>
                Beratung anfassen statt nachlesen: Diese Betriebe führen Bulltron Race, bauen die Batterien ein und
                kennen die Ladetechnik. Postleitzahl eingeben und den nächstgelegenen Partner finden.
              </p>
            </div>
            <div>
              <div className="stat-strip" style={{ borderTop: 0 }}>
                <div className="stat" style={{ borderRight: 0 }}>
                  <div className="stat__value">{haendler.length}</div>
                  <div className="stat__label">Partner gelistet</div>
                </div>
                <div className="stat" style={{ borderRight: 0 }}>
                  <div className="stat__value">{einbaupartner}</div>
                  <div className="stat__label">davon mit Einbau</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Start</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-soft)' }}>Händler</span>
        </nav>
      </div>

      <section className="section section--tight">
        <div className="container">
          <HaendlerSuche haendler={haendler} />
        </div>
      </section>

      <section className="section section--alt section--tight">
        <div className="container">
          <div className="split">
            <div>
              <span className="eyebrow">Partner werden</span>
              <h2 className="h-md" style={{ marginBottom: '1rem' }}>
                Werkstatt, Händler oder Rennteam?
              </h2>
              <p className="lead">
                Wir suchen Betriebe, die Lithium-Starterbatterien nicht nur verkaufen, sondern auch fachgerecht
                einbauen. Melde dich — wir klären Konditionen, Schulung und Erstausstattung direkt am Telefon.
              </p>
            </div>
            <div className="btn-row" style={{ alignItems: 'center' }}>
              <a href={ANFRAGE_TEL} className="btn">
                <IconPhone size={17} />
                Anrufen
                <IconArrow />
              </a>
              <a href={ANFRAGE_MAIL} className="btn btn--ghost">
                <IconMail size={17} />
                E-Mail schreiben
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
