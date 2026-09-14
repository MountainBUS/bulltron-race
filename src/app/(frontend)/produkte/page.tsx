import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCategories, getProducts } from '../../../lib/payload'
import { ProductCard } from '../../../components/ProductCard'
import { IconArrow } from '../../../components/Icons'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Alle Batterien',
  description:
    'Die komplette Bulltron-Race-Baureihe: Lithium-Starterbatterien für Motorsport, Rennsport und Motorrad — entwickelt und konfektioniert in Deutschland.',
  alternates: { canonical: '/produkte' },
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()])

  return (
    <>
      <section className="page-hero">
        <div className="stripes" />
        <div className="glow glow--primary" style={{ width: 420, height: 420, top: '-30%', right: '4%' }} />
        <div className="container">
          <div className="page-hero__inner">
            <div className="page-hero__text">
              <span className="eyebrow">Sortiment</span>
              <h1 className="h-lg">Alle Bulltron-Race-Batterien</h1>
              <p className="lead" style={{ marginTop: '1.1rem' }}>
                Fünf Kapazitäten von 4 bis 55 Ah, neun Ausführungen: im Kunststoff-Gehäuse für Motorräder, im
                Metall-Gehäuse und in den genormten Maßen L1, L2 und L3. Alle 12,8 V LiFePO4.
              </p>
            </div>
            <div>
              <div className="stat-strip" style={{ borderTop: 0 }}>
                <div className="stat" style={{ borderRight: 0 }}>
                  <div className="stat__value">{products.length}</div>
                  <div className="stat__label">Modelle verfügbar</div>
                </div>
                <div className="stat" style={{ borderRight: 0 }}>
                  <div className="stat__value">5 Jahre</div>
                  <div className="stat__label">Herstellergarantie</div>
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
          <span style={{ color: 'var(--text-soft)' }}>Produkte</span>
        </nav>
      </div>

      <section className="section section--tight">
        <div className="container">
          {categories.length > 0 ? (
            <div className="btn-row" style={{ marginBottom: '2.5rem' }}>
              <span className="btn btn--sm btn--dark" aria-current="page">
                Alle ({products.length})
              </span>
              {categories.map((category) => (
                <Link key={category.id} href={`/${category.slug}`} className="btn btn--sm btn--ghost">
                  {category.title}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="grid grid--3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <h2>Noch keine Produkte angelegt</h2>
              <p>Im Backend unter „Shop → Produkte“ lassen sich Batterien anlegen.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section section--alt section--tight">
        <div className="container">
          <div className="split">
            <div>
              <span className="eyebrow">Beratung</span>
              <h2 className="h-md" style={{ marginBottom: '1rem' }}>Unsicher, welche Batterie passt?</h2>
              <p className="lead">
                Startstrom, Einbaumaß, Ladesystem — wir klären das in fünf Minuten am Telefon. Ruf an oder schreib uns,
                wir melden uns noch am selben Werktag zurück.
              </p>
            </div>
            <div className="btn-row" style={{ alignItems: 'center' }}>
              <a href="tel:+4936134948420" className="btn">
                Jetzt anrufen
                <IconArrow />
              </a>
              <a href="mailto:info@bulltron-race.de" className="btn btn--ghost">
                E-Mail schreiben
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
