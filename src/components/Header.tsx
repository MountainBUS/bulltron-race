'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from './CartProvider'
import { IconCart, IconClose, IconMenu, IconPhone, LogoMark } from './Icons'
import { shopEnabled } from '../lib/shop'

export type NavItem = { label: string; url: string }

type Props = {
  siteName: string
  logoUrl?: string | null
  nav: NavItem[]
  ctaLabel?: string | null
  ctaUrl?: string | null
  announcement?: string | null
}

export const Header = ({ siteName, logoUrl, nav, ctaLabel, ctaUrl, announcement }: Props) => {
  const { count, ready } = useCart()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const brand = (
    <Link href="/" className="logo" aria-label={`${siteName} — zur Startseite`}>
      {logoUrl ? (
        <img src={logoUrl} alt={siteName} />
      ) : (
        <>
          <LogoMark className="logo__mark" />
          <span className="logo__text">
            Bulltron <span>Race</span>
          </span>
        </>
      )}
    </Link>
  )

  return (
    <>
      {announcement ? <div className="announce">{announcement}</div> : null}

      <header className="header">
        <div className="container header__inner">
          {brand}

          <nav className="nav" aria-label="Hauptnavigation">
            {nav.map((item) => (
              <Link key={`${item.url}-${item.label}`} href={item.url}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header__actions">
            {ctaLabel && ctaUrl ? (
              <a className="btn btn--sm btn--ghost" href={ctaUrl}>
                <IconPhone size={16} />
                {ctaLabel}
              </a>
            ) : null}

            {shopEnabled ? (
              <Link href="/warenkorb" className="icon-btn" aria-label={`Warenkorb, ${ready ? count : 0} Artikel`}>
                <IconCart />
                {ready && count > 0 ? <span className="cart-count">{count}</span> : null}
              </Link>
            ) : null}

            <button
              type="button"
              className="icon-btn burger"
              onClick={() => setOpen(true)}
              aria-label="Menü öffnen"
              aria-expanded={open}
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="mobile-nav" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="mobile-nav__top">
            {brand}
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Menü schließen">
              <IconClose />
            </button>
          </div>
          {nav.map((item) => (
            <Link key={`m-${item.url}-${item.label}`} href={item.url} className="mobile-nav__link">
              {item.label}
            </Link>
          ))}
          {ctaLabel && ctaUrl ? (
            <a className="btn btn--block" href={ctaUrl}>
              <IconPhone size={17} />
              {ctaLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
