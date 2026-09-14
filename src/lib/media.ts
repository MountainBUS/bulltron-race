import type { Media } from '../payload-types'

type MediaLike = number | Media | null | undefined

export const mediaUrl = (media: MediaLike, size?: 'thumbnail' | 'card' | 'hero'): string | null => {
  if (!media || typeof media === 'number') return null
  if (size && media.sizes?.[size]?.url) return media.sizes[size]!.url as string
  return (media.url as string) ?? null
}

export const mediaAlt = (media: MediaLike, fallback = ''): string => {
  if (!media || typeof media === 'number') return fallback
  return media.alt || fallback
}

export const mediaDimensions = (media: MediaLike): { width: number; height: number } => {
  if (!media || typeof media === 'number') return { width: 1200, height: 900 }
  return { width: media.width ?? 1200, height: media.height ?? 900 }
}
