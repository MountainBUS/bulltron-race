import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPages, getCategories, getCategoryBySlug, getPageBySlug, getProducts } from '../../../lib/payload'
import { mediaAlt, mediaUrl } from '../../../lib/media'
import { formatDate } from '../../../lib/format'
import { ProductCard } from '../../../components/ProductCard'
import { RichText } from '../../../components/RichText'
import { IconArrow, IconCheck } from '../../../components/Icons'

type Props = { params: Promise<{ slug: string }> }

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (category) {
    return {
      title: category.seo?.title || category.headline || category.title,
      description: category.seo?.description || category.subline || undefined,
      alternates: { canonical: `/${category.slug}` },
      robots: category.seo?.noindex ? { index: false, follow: false } : undefined,
    }
  }

  const page = await getPageBySlug(slug)
  if (page) {
    return {
      title: page.seo?.title || page.title,
      description: page.seo?.description || page.subtitle || undefined,
      alternates: { canonical: `/${page.slug}` },
      robots: page.seo?.noindex ? { index: false, follow: false } : { index: true, follow: true },
    }
  }

  return {}
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params

  const category = await getCategoryBySlug(slug)
  if (category) return <CategoryView slug={slug} category={category} />

  const page = await getPageBySlug(slug)
  if (page) return <LegalView page={page} />

  notFound()
}

/* ------------------------------------------------------------------ */
/* Kategorie-Übersicht                                                 */
/* ------------------------------------------------------------------ */
async function CategoryView({ category }: { slug: string; category: Awaited<ReturnType<typeof getCategoryBySlug>> }) {
  if (!category) notFound()
  const products = await getProducts(category.id)
  const heroImage = mediaUrl(category.image, 'hero')

  return (
    <>
      <section className="page-hero">
        <div className="stripes" />
        <div className="glow glow--primary" style={{ width: 460, height: 460, top: '-35%', right: '-4%' }} />
        <div className="container">
          <div className="page-hero__inner">
            <div className="page-hero__text">
              {category.eyebrow ? <span className="eyebrow">{category.eyebrow}</span> : null}
              <h1 className="h-lg">{category.headline || category.title}</h1>
              {category.subline ? <p className="lead" style={{ marginTop: '1.1rem' }}>{category.subline}</p> : null}
              <div className="btn-row" style={{ marginTop: '2rem' }}>
                <a href="#produkte" className="btn">
                  {products.length} {products.length === 1 ? 'Modell' : 'Modelle'} ansehen
                  <IconArrow />
                </a>
                <Link href="/produkte" className="btn btn--ghost">
                  Gesamtes Sortiment
                </Link>
              </div>
            </div>

            {heroImage ? (
              <div className="split__media" style={{ aspectRatio: '16 / 11' }}>
                <img src={heroImage} alt={mediaAlt(category.image, category.title)} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Start</Link>
          <span>/</span>
          <Link href="/produkte">Produkte</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-soft)' }}>{category.title}</span>
        </nav>
      </div>

      {category.highlights && category.highlights.length > 0 ? (
        <section className="section section--tight">
          <div className="container">
            <div className="grid grid--3">
              {category.highlights.map((highlight) => (
                <div className="usp" key={highlight.title}>
                  <div className="usp__icon">
                    <IconCheck size={28} />
                  </div>
                  <h3>{highlight.title}</h3>
                  {highlight.text ? <p>{highlight.text}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section section--tight" id="produkte">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Modelle</span>
            <h2 className="h-md">{category.title} im Überblick</h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid--3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Noch keine Produkte in dieser Kategorie</h2>
              <p>Produkte lassen sich im Backend unter „Shop → Produkte“ dieser Kategorie zuordnen.</p>
              <Link href="/produkte" className="btn">Gesamtes Sortiment ansehen</Link>
            </div>
          )}
        </div>
      </section>

      {category.body ? (
        <section className="section section--alt">
          <div className="container">
            <RichText data={category.body} />
          </div>
        </section>
      ) : null}

      {category.faq && category.faq.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">FAQ</span>
              <h2 className="h-md">Häufige Fragen</h2>
            </div>
            <div className="faq">
              {category.faq.map((entry) => (
                <details key={entry.question}>
                  <summary>{entry.question}</summary>
                  <p>{entry.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Rechtstexte / freie Seiten                                          */
/* ------------------------------------------------------------------ */
function LegalView({ page }: { page: NonNullable<Awaited<ReturnType<typeof getPageBySlug>>> }) {
  return (
    <>
      <section className="page-hero">
        <div className="stripes" />
        <div className="container">
          <div className="page-hero__text" style={{ position: 'relative', zIndex: 1 }}>
            <span className="eyebrow">Rechtliches</span>
            <h1 className="h-lg">{page.title}</h1>
            {page.subtitle ? <p className="lead" style={{ marginTop: '1rem' }}>{page.subtitle}</p> : null}
          </div>
        </div>
      </section>

      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Start</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-soft)' }}>{page.title}</span>
        </nav>
      </div>

      <section className="section section--tight">
        <div className="container">
          <div className="legal-layout">
            <RichText data={page.content} />
            <aside className="legal-aside">
              <h3>Fragen dazu?</h3>
              <p style={{ marginBottom: '1rem' }}>
                Bei Fragen zu diesen Angaben erreichst du uns direkt — telefonisch oder per E-Mail.
              </p>
              <ul>
                <li>
                  <a href="tel:+4936134948420">+49 361 34948420</a>
                </li>
                <li>
                  <a href="mailto:info@bulltron-race.de">info@bulltron-race.de</a>
                </li>
              </ul>
              {page.lastUpdated ? (
                <p className="muted" style={{ marginTop: '1.2rem', fontSize: '0.85rem' }}>
                  Stand: {formatDate(page.lastUpdated)}
                </p>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
