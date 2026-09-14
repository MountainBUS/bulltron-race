/**
 * Akzeptiert alle gängigen YouTube-Formate und gibt die reine Video-ID zurück.
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   ID
 */
export function getYouTubeId(input?: string | null): string | null {
  if (!input) return null
  const value = input.trim()
  if (!value) return null

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match) return match[1]
  }
  return null
}

/** youtube-nocookie: kein Tracking-Cookie vor dem Abspielen. */
export const getEmbedUrl = (id: string): string =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`

export const getWatchUrl = (id: string): string => `https://www.youtube.com/watch?v=${id}`
