import { getPayload } from 'payload'
import { cache } from 'react'
import config from '@payload-config'

export const getPayloadClient = cache(async () => getPayload({ config }))

/**
 * Die beiden Globals werden vom Layout gelesen und damit auch beim Build
 * angefasst — zu einem Zeitpunkt, an dem im Container noch keine Datenbank
 * existiert. Deshalb hier ein Auffangnetz: lieber leere Einstellungen als ein
 * abgebrochener Build.
 */
const leerBeiFehler = async <T>(laden: () => Promise<T>, name: string): Promise<T> => {
  try {
    return await laden()
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[payload] ${name} konnte nicht geladen werden:`, error)
    }
    return {} as T
  }
}

export const getSiteSettings = cache(async () =>
  leerBeiFehler(async () => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'site-settings', depth: 2 })
  }, 'site-settings'),
)

export const getHome = cache(async () =>
  leerBeiFehler(async () => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'home', depth: 2 })
  }, 'home'),
)

export const getCategories = cache(async () => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'categories',
    limit: 50,
    sort: 'sortOrder',
    depth: 2,
  })
  return res.docs
})

export const getCategoryBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
})

export const getProducts = cache(async (categoryId?: string | number) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'published' },
      ...(categoryId ? { category: { equals: categoryId } } : {}),
    },
    limit: 200,
    sort: 'sortOrder',
    depth: 2,
  })
  return res.docs
})

export const getProductBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
})

export const getPageBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
})

export const getAllPages = cache(async () => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'pages', limit: 100, depth: 0 })
  return res.docs
})

/* ------------------------------------------------------------ Rennteams -- */

export const getTeams = cache(async () => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'teams',
    where: { published: { equals: true } },
    limit: 200,
    sort: ['-featured', 'sortOrder', 'teamName'],
    depth: 2,
  })
  return res.docs
})

export const getTeamBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'teams',
    where: { slug: { equals: slug }, published: { equals: true } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
})
