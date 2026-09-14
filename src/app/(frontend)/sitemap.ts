import type { MetadataRoute } from 'next'
import { getAllPages, getCategories, getProducts } from '../../lib/payload'

// Inhalte kommen aus dem Backend und sollen ohne Rebuild sichtbar werden.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const [products, categories, pages] = await Promise.all([getProducts(), getCategories(), getAllPages()])

  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/produkte`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/haendler`, changeFrequency: 'weekly', priority: 0.6 },
    ...categories.map((category) => ({
      url: `${base}/${category.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/produkte/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...pages.map((page) => ({
      url: `${base}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ]
}
