import React from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CartProvider } from '../../components/CartProvider'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { getSiteSettings } from '../../lib/payload'
import { mediaUrl } from '../../lib/media'
import { shopEnabled } from '../../lib/shop'

export const viewport: Viewport = {
  themeColor: '#12171a',
  width: 'device-width',
  initialScale: 1,
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  return {
    metadataBase: new URL(base),
    title: {
      default: `${settings.siteName ?? 'BULLTRON RACE'} — ${settings.tagline ?? ''}`.trim(),
      template: `%s · ${settings.siteName ?? 'BULLTRON RACE'}`,
    },
    description: settings.defaultSeoDescription ?? undefined,
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      siteName: settings.siteName ?? 'BULLTRON RACE',
      images: mediaUrl(settings.defaultSeoImage, 'hero') ?? undefined,
    },
    robots: { index: true, follow: true },
  }
}

const fallbackNav = [
  { label: 'Produkte', url: '/produkte' },
  { label: 'Motorsport', url: '/motorsportbatterien' },
  { label: 'Rennsport', url: '/rennsportbatterien' },
  { label: 'Motorrad', url: '/motorradbatterien' },
]

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  // Ohne Shop führen Warenkorb und Kasse ins Leere — Links raus.
  const shopPfade = ['/warenkorb', '/kasse', '/bestellung']
  const sichtbar = (url: string) => shopEnabled || !shopPfade.includes(url)

  const nav = (settings.mainNav ?? [])
    .filter((item) => sichtbar(item.url))
    .map((item) => ({ label: item.label, url: item.url }))

  const columns = (settings.footerColumns ?? []).map((column) => ({
    title: column.title,
    links: (column.links ?? [])
      .filter((link) => sichtbar(link.url))
      .map((link) => ({ label: link.label, url: link.url })),
  }))

  return (
    <html lang="de">
      <body>
        <CartProvider>
          <div className="page-wrap">
            <a className="skip-link" href="#inhalt">
              Zum Inhalt springen
            </a>

            <Header
              siteName={settings.siteName ?? 'BULLTRON RACE'}
              logoUrl={mediaUrl(settings.logo, 'card')}
              nav={nav.length > 0 ? nav : fallbackNav}
              ctaLabel={settings.headerCtaLabel}
              ctaUrl={settings.headerCtaUrl}
              announcement={settings.announcement}
            />

            <main id="inhalt">{children}</main>

            <Footer
              siteName={settings.siteName ?? 'BULLTRON RACE'}
              logoUrl={mediaUrl(settings.footerLogo ?? settings.logo, 'card')}
              tagline={settings.tagline}
              about={settings.footerText}
              columns={columns}
              contact={{
                company: settings.companyName,
                street: settings.street,
                postalCode: settings.postalCode,
                city: settings.city,
                phone: settings.phone,
                mobile: settings.mobile,
                email: settings.email,
                hours: settings.openingHours,
              }}
              copyright={settings.copyright}
              paymentNote={settings.paymentNote}
              priceNote={settings.legal?.priceNote}
            />
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
