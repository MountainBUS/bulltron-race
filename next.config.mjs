import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Hier stand bis zum 19.10.2026 eine 301 von
     /produkte/bulltron-race-118ah-lifepo4 auf die Übersicht, weil die 118 Ah
     nicht in der Preisliste 08/2026 stand. Sie steht in der Liste 06/2026 und
     ist wieder im Sortiment, deshalb ist die Weiterleitung weg: Die Adresse
     führt jetzt wieder auf das Produkt selbst. Eine Weiterleitung hätte
     Vorrang vor der Produktseite und würde sie unerreichbar machen. */
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
