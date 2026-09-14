import React from 'react'
import Link from 'next/link'
import { IconArrow } from '../../components/Icons'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 700, textAlign: 'center' }}>
        <span className="eyebrow" style={{ justifyContent: 'center' }}>Fehler 404</span>
        <h1 className="h-xl" style={{ marginBottom: '1rem' }}>Ins Kiesbett</h1>
        <p className="lead">
          Diese Seite gibt es nicht (mehr). Zurück auf die Ideallinie:
        </p>
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: '2rem' }}>
          <Link href="/" className="btn">
            Zur Startseite
            <IconArrow />
          </Link>
          <Link href="/produkte" className="btn btn--ghost">
            Alle Batterien
          </Link>
        </div>
      </div>
    </section>
  )
}
