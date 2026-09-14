import React from 'react'

type P = { size?: number; className?: string }
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconArrow = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const IconCheck = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M20 6 9 17l-5-5" /></svg>
)
export const IconCart = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.5 12.5A2 2 0 0 0 9.5 17h8.3a2 2 0 0 0 2-1.6L21.5 7H6" /></svg>
)
export const IconPhone = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M21.5 16.9v2.5a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.6 3.6 2 2 0 0 1 3.6 1.4h2.5a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.2 9.2a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></svg>
)
export const IconMail = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m3 6 9 7 9-7" /></svg>
)
export const IconPin = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
)
export const IconMenu = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
)
export const IconClose = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const IconPlay = ({ size = 28, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
)
export const IconDownload = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 3v12M7 11l5 5 5-5M4 20h16" /></svg>
)
export const IconLock = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
)

/* USP-Symbole */
export const IconBolt = ({ size = 34, className }: P) => (
  <svg {...base(size)} className={className}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
)
export const IconShield = ({ size = 34, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
)
export const IconWeight = ({ size = 34, className }: P) => (
  <svg {...base(size)} className={className}><path d="M6.5 8h11l2.5 13H4L6.5 8Z" /><circle cx="12" cy="5" r="2.5" /></svg>
)
export const IconTemp = ({ size = 34, className }: P) => (
  <svg {...base(size)} className={className}><path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0Z" /><path d="M12 9v6" /></svg>
)
export const IconTruck = ({ size = 34, className }: P) => (
  <svg {...base(size)} className={className}><path d="M2 6h11v11H2zM13 10h4.5l3.5 3.5V17h-8" /><circle cx="6.5" cy="19" r="1.8" /><circle cx="17" cy="19" r="1.8" /></svg>
)
export const IconSupport = ({ size = 34, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 14v-2a8 8 0 1 1 16 0v2" /><path d="M4 14h3v6H5.5A1.5 1.5 0 0 1 4 18.5V14ZM20 14h-3v6h1.5a1.5 1.5 0 0 0 1.5-1.5V14Z" /></svg>
)
export const IconFactory = ({ size = 34, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 21V10l6 4V10l6 4V6h6v15H3Z" /><path d="M7 17h2M13 17h2M18 17h1" /></svg>
)
export const IconCycle = ({ size = 34, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2" /><path d="M18 2v4h-4M6 22v-4h4" /></svg>
)

export const uspIcons: Record<string, React.FC<P>> = {
  bolt: IconBolt,
  shield: IconShield,
  weight: IconWeight,
  temp: IconTemp,
  truck: IconTruck,
  support: IconSupport,
  factory: IconFactory,
  cycle: IconCycle,
}

export const LogoMark = ({ size = 34, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden className={className}>
    <path d="M20 1.5 36.5 10v20L20 38.5 3.5 30V10L20 1.5Z" stroke="#e03e51" strokeWidth="2" />
    <path d="M21.8 10 12 21.4h6.3L17 30l10.4-12.2h-6.6L21.8 10Z" fill="#e03e51" />
  </svg>
)
