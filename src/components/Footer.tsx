import React from 'react'
import Link from 'next/link'
import { IconMail, IconPhone, IconPin, LogoMark } from './Icons'
import { shopEnabled } from '../lib/shop'

type LinkItem = { label: string; url: string }

type Props = {
  siteName: string
  logoUrl?: string | null
  tagline?: string | null
  about?: string | null
  columns: { title: string; links: LinkItem[] }[]
  contact: {
    company?: string | null
    street?: string | null
    postalCode?: string | null
    city?: string | null
    phone?: string | null
    mobile?: string | null
    email?: string | null
    hours?: string | null
  }
  copyright?: string | null
  paymentNote?: string | null
  priceNote?: string | null
}

const telHref = (value?: string | null) => (value ? `tel:${value.replace(/[^+\d]/g, '')}` : undefined)

export const Footer = ({ siteName, logoUrl, tagline, about, columns, contact, copyright, paymentNote, priceNote }: Props) => (
  <footer className="footer">
    <div className="rule" />
    <div className="container footer__grid">
      <div className="footer__about">
        {logoUrl ? (
          <img src={logoUrl} alt={siteName} className="footer__logo" />
        ) : (
          <div className="logo">
            <LogoMark className="logo__mark" />
            <span className="logo__text">
              {siteName.split(' ')[0]} <span>{siteName.split(' ').slice(1).join(' ')}</span>
            </span>
          </div>
        )}
        {tagline && !logoUrl ? (
          <p style={{ marginTop: '0.9rem', color: 'var(--primary-bright)', fontWeight: 600 }}>{tagline}</p>
        ) : null}
        {about ? <p>{about}</p> : null}

        <div className="footer__contact">
          {contact.phone ? (
            <a href={telHref(contact.phone)}>
              <IconPhone size={16} /> {contact.phone}
            </a>
          ) : null}
          {contact.mobile ? (
            <a href={telHref(contact.mobile)}>
              <IconPhone size={16} /> {contact.mobile}
            </a>
          ) : null}
          {contact.email ? (
            <a href={`mailto:${contact.email}`}>
              <IconMail size={16} /> {contact.email}
            </a>
          ) : null}
          {contact.street ? (
            <span style={{ display: 'inline-flex', gap: '0.55rem', alignItems: 'flex-start' }}>
              <IconPin size={16} />
              <span>
                {contact.company}
                <br />
                {contact.street}
                <br />
                {contact.postalCode} {contact.city}
              </span>
            </span>
          ) : null}
          {contact.hours ? <span className="muted">{contact.hours}</span> : null}
        </div>
      </div>

      {columns.map((column) => (
        <div key={column.title}>
          <h3>{column.title}</h3>
          <ul>
            {column.links.map((link) => (
              <li key={`${column.title}-${link.url}`}>
                <Link href={link.url}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="container">
      <div className="footer__bar">
        <span>
          {copyright} {new Date().getFullYear()}
          {priceNote ? ` · ${priceNote}` : ''}
        </span>
        {shopEnabled ? (
          <div className="footer__pay">
            {paymentNote ? <span style={{ marginRight: '0.4rem' }}>{paymentNote}</span> : null}
            <span className="pay-chip">Visa</span>
            <span className="pay-chip">Mastercard</span>
            <span className="pay-chip">Apple Pay</span>
            <span className="pay-chip">Google Pay</span>
            <span className="pay-chip">Klarna</span>
          </div>
        ) : (
          <div className="footer__pay">
            <span className="pay-chip">Made in Germany</span>
            <span className="pay-chip">5 Jahre Garantie</span>
          </div>
        )}
      </div>
    </div>
  </footer>
)
