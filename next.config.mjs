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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
