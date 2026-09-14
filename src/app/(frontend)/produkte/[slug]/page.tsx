import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, getProducts, getSiteSettings } from '../../../../lib/payload'
import { mediaAlt, mediaUrl } from '../../../../lib/media'
import { availabilityLabel, formatPrice } from '../../../../lib/format'
import { getYouTubeId } from '../../../../lib/youtube'
import { AddToCart } from '../../../../components/AddToCart'
import { shopEnabled, ANFRAGE_TEL, ANFRAGE_MAIL } from '../../../../lib/shop'
import { ProductGallery } from '../../../../components/ProductGallery'
import { ProductCard } from '../../../../components/ProductCard'
import { RichText } from '../../../../components/RichText'
import { YouTubeEmbed } from '../../../../components/YouTubeEmbed'
import { IconCheck, IconDownload, IconLock, IconPhone, IconShield, IconTruck } from '../../../../components/Icons'

type Props = { params: Promise<{ slug: string }> }

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  return {
    title: product.seo?.title || product.title,
    description: product.seo?.description || product.shortDescription || undefined,
    alternates: { canonical: `/produkte/${product.slug}` },
    robots: product.seo?.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: product.title,
      description: product.shortDescription ?? undefined,
      images: mediaUrl(product.seo?.image ?? product.mainImage, 'hero') ?? undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const settings = await getSiteSettings()
  const category = typeof product.category === 'object' ? product.category : null
  const availability = availabilityLabel[product.availability ?? 'in_stock'] ?? availabilityLabel.in_stock

  const images = [
    product.mainImage ? { url: mediaUrl(product.mainImage, 'hero')!, alt: mediaAlt(product.mainImage, product.title) } : null,
    ...(product.gallery ?? []).map((entry) =>
      entry.image ? { url: mediaUrl(entry.image, 'hero')!, alt: mediaAlt(entry.image, product.title) } : null,
    ),
  ].filter(Boolean) as { url: string; alt: string }[]

  const videoId = getYouTubeId(product.video?.url)

  const related = (await getProducts(category?.id))
    .filter((entry) => entry.id !== product.id)
    .slice(0, 3)

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription ?? undefined,
    sku: product.sku ?? undefined,
    brand: { '@type': 'Brand', name: 'BULLTRON RACE' },
    image: images.map((image) => `${baseUrl}${image.url}`),
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/produkte/${product.slug}`,
      priceCurrency: 'EUR',
      price: product.price?.toFixed(2),
      availability: availability.buyable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Start</Link>
          <span>/</span>
          <Link href="/produkte">Produkte</Link>
          {category ? (
            <>
              <span>/</span>
              <Link href={`/${category.slug}`}>{category.title}</Link>
            </>
          ) : null}
          <span>/</span>
          <span style={{ color: 'var(--text-soft)' }}>{product.title}</span>
        </nav>

        {/* ---------- Kaufbereich ---------- */}
        <div className="pdp">
          <ProductGallery images={images} title={product.title} />

          <div>
            {product.badge ? <span className="badge badge--static">{product.badge}</span> : null}
            <h1 className="pdp__title" style={{ marginTop: product.badge ? '0.9rem' : 0 }}>
              {product.title}
            </h1>
            {product.subtitle ? <p className="pdp__sub">{product.subtitle}</p> : null}
            {product.shortDescription ? <p className="lead">{product.shortDescription}</p> : null}

            {product.highlights && product.highlights.length > 0 ? (
              <ul className="checklist" style={{ marginTop: '1.6rem' }}>
                {product.highlights.map((item) => (
                  <li key={item.text}>
                    <IconCheck size={19} />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="pdp__price-box">
              <div className="price price--lg">
                {formatPrice(product.price)}
                {product.compareAtPrice ? <span className="price__strike">{formatPrice(product.compareAtPrice)}</span> : null}
              </div>
              <div className="price-note">
                {settings.legal?.priceNote ?? 'Alle Preise inkl. gesetzlicher MwSt., zzgl. Versandkosten.'}
                {product.shippingNote ? ` ${product.shippingNote}` : ''}
              </div>

              <div className="buy-row">
                {shopEnabled ? (
                  <AddToCart
                    withQuantity
                    className="btn btn--lg"
                    disabled={!availability.buyable}
                    product={{
                      id: String(product.id),
                      slug: product.slug,
                      title: product.title,
                      subtitle: product.subtitle,
                      sku: product.sku,
                      price: product.price,
                      image: images[0]?.url ?? null,
                    }}
                  />
                ) : (
                  <>
                    <a href={ANFRAGE_TEL} className="btn btn--lg">
                      Jetzt anfragen
                    </a>
                    <a href={ANFRAGE_MAIL} className="btn btn--lg btn--ghost">
                      E-Mail schreiben
                    </a>
                  </>
                )}
              </div>

              <div className="pdp__meta">
                <span className={`availability ${availability.modifier}`}>{availability.label}</span>
                {product.deliveryTime ? (
                  <span>
                    Lieferzeit: <strong>{product.deliveryTime}</strong>
                  </span>
                ) : null}
                {product.sku ? (
                  <span>
                    Art.-Nr.: <strong>{product.sku}</strong>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="trust-row">
              <div className="trust-item">
                <IconTruck size={20} /> Versand aus Deutschland
              </div>
              <div className="trust-item">
                <IconShield size={20} /> 5 Jahre Herstellergarantie
              </div>
              <div className="trust-item">
                {shopEnabled ? (
                  <>
                    <IconLock size={20} /> Sichere Zahlung über Stripe
                  </>
                ) : (
                  <>
                    <IconPhone size={20} /> Beratung direkt vom Hersteller
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Beschreibung & Daten ---------- */}
      {(product.description || (product.specs && product.specs.length > 0)) ? (
        <section className="section section--alt">
          <div className="container">
            <div className="split" style={{ alignItems: 'start' }}>
              <div>
                <span className="eyebrow">Produktbeschreibung</span>
                <h2 className="h-md" style={{ marginBottom: '1.3rem' }}>Das steckt drin</h2>
                {product.description ? <RichText data={product.description} /> : null}

                {product.downloads && product.downloads.length > 0 ? (
                  <>
                    <h3 className="h-sm" style={{ margin: '2.2rem 0 1rem' }}>Downloads</h3>
                    <ul className="downloads">
                      {product.downloads.map((download) => (
                        <li key={download.label}>
                          <a href={download.url ?? '#'} target="_blank" rel="noopener noreferrer">
                            <IconDownload /> {download.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>

              {product.specs && product.specs.length > 0 ? (
                <div>
                  <span className="eyebrow">Technische Daten</span>
                  <h2 className="h-md" style={{ marginBottom: '1.3rem' }}>Datenblatt</h2>
                  <div className="table-wrap">
                    <table className="table-specs">
                      <tbody>
                        {product.specs.map((spec) => (
                          <tr key={spec.label}>
                            <th scope="row">{spec.label}</th>
                            <td>{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Video ---------- */}
      {videoId ? (
        <section className="section">
          <div className="container">
            <div className="split">
              <div>
                <span className="eyebrow">Video</span>
                <h2 className="h-md" style={{ marginBottom: '1rem' }}>{product.video?.title || 'Das Produkt im Einsatz'}</h2>
                {product.video?.description ? <p className="lead">{product.video.description}</p> : null}
              </div>
              <div>
                <div className="video-card">
                  <YouTubeEmbed
                    videoId={videoId}
                    title={product.video?.title || product.title}
                    previewUrl={mediaUrl(product.video?.previewImage, 'card')}
                    previewAlt={mediaAlt(product.video?.previewImage, product.title)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Ähnliche Produkte ---------- */}
      {related.length > 0 ? (
        <section className="section section--alt">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Passt ebenfalls</span>
              <h2 className="h-md">Weitere Modelle{category ? ` aus ${category.title}` : ''}</h2>
            </div>
            <div className="grid grid--3">
              {related.map((entry) => (
                <ProductCard key={entry.id} product={entry} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
