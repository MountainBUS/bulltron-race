import React from 'react'
import type { Metadata } from 'next'
import { getEvents } from '../../../lib/payload'
import { aufgeteilt } from '../../../lib/veranstaltungen'
import { VeranstaltungsListe } from '../../../components/VeranstaltungsListe'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Veranstaltungen',
  description:
    'Rennen, Messen und Trackdays: wo Bulltron Race vor Ort ist und wo unsere Rennteams an den Start gehen.',
  alternates: { canonical: '/veranstaltungen' },
}

export default async function VeranstaltungenPage() {
  const events = await getEvents().catch(() => [])
  const { kommend, vergangen } = aufgeteilt(events as never[])
  const mitBulltron = kommend.filter((v) => v.bulltron?.present).length

  return (
    <>
      <section className="page-hero">
        <div className="stripes" />
        <div className="glow glow--primary" style={{ width: 420, height: 420, top: '-30%', right: '4%' }} />
        <div className="container">
          <div className="page-hero__inner">
            <div className="page-hero__text">
              <span className="eyebrow">Kalender</span>
              <h1 className="h-lg">Veranstaltungen</h1>
              <p className="lead" style={{ marginTop: '1.1rem' }}>
                Rennen, Messen und Trackdays. Hier steht, wo unsere Rennteams an den Start gehen und wo du uns
                selbst triffst — mit Beratung, Batterien und offener Box.
              </p>
            </div>
            {kommend.length > 0 ? (
              <div>
                <div className="stat-strip" style={{ borderTop: 0 }}>
                  <div className="stat" style={{ borderRight: 0 }}>
                    <div className="stat__value">{kommend.length}</div>
                    <div className="stat__label">{kommend.length === 1 ? 'Termin' : 'Termine'}</div>
                  </div>
                  {mitBulltron > 0 ? (
                    <div className="stat" style={{ borderRight: 0 }}>
                      <div className="stat__value">{mitBulltron}</div>
                      <div className="stat__label">davon mit uns vor Ort</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <VeranstaltungsListe kommend={kommend as never[]} vergangen={vergangen as never[]} />
        </div>
      </section>
    </>
  )
}
