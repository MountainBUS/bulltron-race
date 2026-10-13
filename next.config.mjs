import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Die 118-Ah-Batterie steht nicht mehr in der Preisliste 08/2026. Die alte
     Adresse bleibt erreichbar und führt auf die Übersicht, statt ins Leere. */
  async redirects() {
    return [
      {
        source: '/produkte/bulltron-race-118ah-lifepo4',
        destination: '/produkte',
        permanent: true,
      },
    ]
  },
  /* Die Medienroute lieferte Bilder ohne jede Angabe zur Zwischenspeicherung
     aus — kein Cache-Control, kein ETag, kein Last-Modified. Der Browser hatte
     damit keine Grundlage, ein Bild wiederzuverwenden: Gemessen am 13.10.2026
     lud die Seite /produkte 11 Bilder mit zusammen 6.331 KB neu, darunter beide
     Logos, die Sekunden zuvor auf der Startseite schon vollständig geladen
     worden waren.

     30 Tage sind vertretbar, weil Payload Dateinamen nicht wiederverwendet:
     Wird ein Bild ersetzt, bekommt es einen neuen Namen und damit eine neue
     Adresse. Ein zwischengespeichertes Bild kann also nicht veralten, solange
     niemand von Hand eine Datei im Volume überschreibt.

     stale-while-revalidate erlaubt dem Browser, nach Ablauf kurz die alte
     Fassung zu zeigen und im Hintergrund nachzuladen, statt den Seitenaufbau
     anzuhalten. */
  async headers() {
    return [
      {
        source: '/api/media/file/:pfad*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
