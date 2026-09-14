import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCategories, getHome, getProducts } from '../../lib/payload'
import { mediaAlt, mediaUrl } from '../../lib/media'
import { getYouTubeId } from '../../lib/youtube'
import { ProductCard } from '../../components/ProductCard'
import { RichText } from '../../components/RichText'
import { YouTubeEmbed } from '../../components/YouTubeEmbed'
import { IconArrow, IconCheck, uspIcons, IconBolt } from '../../components/Icons'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHome()
  return {
    title: home.seo?.title || undefined,
    description: home.seo?.description || home.subline || undefined,
    alternates: { canonical: '/' },
  }
}

/** Hebt den Akzent-Teil der Überschrift farblich hervor. */
function renderHeadline(headline: string, accent?: string | null) {
  if (!accent || !headline.includes(accent)) return headline
  const [before, ...rest] = headline.split(accent)
  return (
    <>
      {before}
      <span className="accent">{accent}</span>
      {rest.join(accent)}
    </>
  )
}

export default async function HomePage() {
  const [home, categories, allProducts] = await Promise.all([getHome(), getCategories(), getProducts()])

  const featured =
    Array.isArray(home.featuredProducts) && home.featuredProducts.length > 0
      ? (home.featuredProducts.filter((item) => typeof item === 'object') as typeof allProducts)
      : allProducts.filter((product) => product.featured)

  /* Die Startseite zeigt höchstens drei Produkte — so vorgegeben. Mehr im
     Backend auszuwählen ändert daran nichts. */
  const productsToShow = (featured.length > 0 ? featured : allProducts).slice(0, 3)
  const heroImage = mediaUrl(home.image, 'hero')
  const heroHintergrund = mediaUrl(home.backgroundImage, 'hero')

  // Welcher Bildausschnitt sichtbar bleibt, wenn der Bereich schmaler wird.
  const ausschnitt: Record<string, string> = {
    left: '20% 50%',
    'center-left': '35% 52%',
    center: '50% 52%',
    'center-right': '62% 72%',
    right: '80% 72%',
  }
  const bildPosition = ausschnitt[home.backgroundFocus ?? 'center-right'] ?? '62% 72%'
  const teaser = home.teaser
  const videoSection = home.videoSection
  const videos = (videoSection?.videos ?? []).map((video) => ({ ...video, id: getYouTubeId(video.url) })).filter((v) => v.id)

  const categoryCards =
    home.categoryCards && home.categoryCards.length > 0
      ? home.categoryCards
          .map((card) => (typeof card.category === 'object' ? { category: card.category, text: card.text, image: card.image } : null))
          .filter(Boolean)
      : categories.map((category) => ({ category, text: null, image: null }))

  const countFor = (categoryId: number | string) =>
    allProducts.filter((product) => (typeof product.category === 'object' ? product.category?.id : product.category) === categoryId).length

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className={`hero${heroHintergrund ? ' hero--foto' : ''}`}>
        {heroHintergrund ? (
          <>
            <img
              className="hero__bg"
              src={heroHintergrund}
              alt={mediaAlt(home.backgroundImage, '')}
              style={{ objectPosition: bildPosition }}
              fetchPriority="high"
            />
            <span className="hero__scrim" />
          </>
        ) : (
          <div className="glow glow--primary" style={{ width: 520, height: 520, top: '-14%', right: '-6%' }} />
        )}
        <div className="stripes" />
        <div className="container">
          <div className="hero__inner">
            <div className="hero__text-col">
              {home.eyebrow ? <span className="eyebrow">{home.eyebrow}</span> : null}
              <h1 className="hero__title">{renderHeadline(home.headline, home.headlineAccent)}</h1>
              {home.subline ? <p className="lead hero__text">{home.subline}</p> : null}
              <div className="btn-row">
                {home.primaryCtaLabel ? (
                  <Link href={home.primaryCtaUrl || '/produkte'} className="btn btn--lg">
                    {home.primaryCtaLabel}
                    <IconArrow />
                  </Link>
                ) : null}
                {home.secondaryCtaLabel ? (
                  <a href={home.secondaryCtaUrl || '#'} className="btn btn--lg btn--ghost">
                    {home.secondaryCtaLabel}
                  </a>
                ) : null}
              </div>
            </div>

            {!heroHintergrund ? (
              <div className="hero__media">
                {heroImage ? (
                  <img src={heroImage} alt={mediaAlt(home.image, 'Bulltron Race Batterie')} />
                ) : (
                  <div className="hero__placeholder">
                    <IconBolt size={120} className="accent" />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {home.stats && home.stats.length > 0 ? (
          <div className="container">
            <div className="stat-strip">
              {home.stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <div className="stat__value">{stat.value}</div>
                  <div className="stat__label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ---------- Kategorien ---------- */}
      {categoryCards.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Sortiment</span>
              <h2 className="h-lg">{home.categoriesHeadline}</h2>
              {home.categoriesSubline ? <p className="lead" style={{ marginTop: '1rem' }}>{home.categoriesSubline}</p> : null}
            </div>

            <div className="grid grid--3">
              {categoryCards.map((card: any) => {
                const image = mediaUrl(card.image, 'card') || mediaUrl(card.category.image, 'card')
                const count = countFor(card.category.id)
                return (
                  <Link href={`/${card.category.slug}`} className="cat-card" key={card.category.id}>
                    {image ? <img className="cat-card__bg" src={image} alt="" loading="lazy" /> : null}
                    <span className="cat-card__shade" />
                    <div className="cat-card__body">
                      <div className="cat-card__count">{count} {count === 1 ? 'Modell' : 'Modelle'}</div>
                      <h3>{card.category.title}</h3>
                      <p>{card.text || card.category.subline}</p>
                      <span className="link-arrow">
                        Zur Übersicht <IconArrow size={16} />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Produkte ---------- */}
      {productsToShow.length > 0 ? (
        <section className="section section--alt">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Programm</span>
              <h2 className="h-lg">{home.productsHeadline}</h2>
              {home.productsSubline ? <p className="lead" style={{ marginTop: '1rem' }}>{home.productsSubline}</p> : null}
            </div>

            <div className="grid grid--3">
              {productsToShow.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <Link href="/produkte" className="btn btn--ghost">
                Alle Batterien ansehen
                <IconArrow />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Teaser ---------- */}
      {teaser?.enabled ? (
        <section className="section">
          <div className="container">
            <div className={`split ${teaser.imagePosition === 'left' ? 'split--reverse' : ''}`}>
              <div>
                {teaser.eyebrow ? <span className="eyebrow">{teaser.eyebrow}</span> : null}
                {teaser.headline ? <h2 className="h-lg" style={{ marginBottom: '1.2rem' }}>{teaser.headline}</h2> : null}
                {teaser.text ? <RichText data={teaser.text} className="prose" /> : null}

                {teaser.bullets && teaser.bullets.length > 0 ? (
                  <ul className="checklist" style={{ marginTop: '1.7rem' }}>
                    {teaser.bullets.map((bullet) => (
                      <li key={bullet.text}>
                        <IconCheck size={19} />
                        <span>{bullet.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {teaser.ctaLabel ? (
                  <Link href={teaser.ctaUrl || '/produkte'} className="btn">
                    {teaser.ctaLabel}
                    <IconArrow />
                  </Link>
                ) : null}
              </div>

              <div className="split__media">
                {mediaUrl(teaser.image, 'card') ? (
                  <img src={mediaUrl(teaser.image, 'card')!} alt={mediaAlt(teaser.image, teaser.headline ?? '')} loading="lazy" />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Videos ---------- */}
      {videoSection?.enabled && videos.length > 0 ? (
        <section className="section section--alt">
          <div className="container">
            <div className="section-head">
              {videoSection.eyebrow ? <span className="eyebrow">{videoSection.eyebrow}</span> : null}
              <h2 className="h-lg">{videoSection.headline}</h2>
              {videoSection.subline ? <p className="lead" style={{ marginTop: '1rem' }}>{videoSection.subline}</p> : null}
            </div>

            <div className={videos.length === 1 ? 'grid grid--2' : 'grid grid--3'}>
              {videos.map((video) => (
                <article className="video-card" key={video.id}>
                  <YouTubeEmbed
                    videoId={video.id!}
                    title={video.title}
                    previewUrl={mediaUrl(video.previewImage, 'card')}
                    previewAlt={mediaAlt(video.previewImage, video.title ?? '')}
                  />
                  {video.title || video.description ? (
                    <div className="video-card__body">
                      {video.title ? <h3>{video.title}</h3> : null}
                      {video.description ? <p>{video.description}</p> : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Vorteile ---------- */}
      {home.usps && home.usps.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-head section-head--center">
              <span className="eyebrow">Technik</span>
              <h2 className="h-lg">{home.uspHeadline}</h2>
            </div>

            <div className="grid grid--4">
              {home.usps.map((usp) => {
                const Icon = uspIcons[usp.icon ?? 'bolt'] ?? uspIcons.bolt
                return (
                  <div className="usp" key={usp.title}>
                    <div className="usp__icon">
                      <Icon size={32} />
                    </div>
                    <h3>{usp.title}</h3>
                    {usp.text ? <p>{usp.text}</p> : null}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Partner ---------- */}
      {home.partners && home.partners.length > 0 ? (
        <section className="section section--tight section--surface">
          <div className="container">
            <div className="section-head section-head--center" style={{ marginBottom: '2.5rem' }}>
              <h2 className="h-sm" style={{ color: 'var(--text-muted)', letterSpacing: '0.16em' }}>
                {home.partnerHeadline}
              </h2>
            </div>
            <div className="partner-strip">
              {home.partners.map((partner) => {
                const logo = mediaUrl(partner.logo, 'thumbnail')
                const content = logo ? (
                  <img src={logo} alt={partner.name} loading="lazy" />
                ) : (
                  <span className="partner-strip__name">{partner.name}</span>
                )
                return partner.url ? (
                  <a key={partner.name} href={partner.url} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  <span key={partner.name}>{content}</span>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- CTA ---------- */}
      {home.ctaBand?.enabled ? (
        <section className="cta-band">
          <div className="container">
            <div className="cta-band__inner">
              <div>
                <h2>{home.ctaBand.headline}</h2>
                {home.ctaBand.text ? <p style={{ marginTop: '0.8rem' }}>{home.ctaBand.text}</p> : null}
              </div>
              {home.ctaBand.ctaLabel ? (
                <div className="cta-band__action">
                  <a href={home.ctaBand.ctaUrl || '/produkte'} className="btn btn--lg btn--accent">
                    {home.ctaBand.ctaLabel}
                    <IconArrow />
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
