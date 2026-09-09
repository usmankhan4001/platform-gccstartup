import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug, getSiteSettings } from '@/lib/directus'
import { buildMetadata } from '@/lib/seo'
import { RenderPage } from '@/puck/RenderPage'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPageBySlug('home'), getSiteSettings()])
  if (!page) return {}
  return buildMetadata(page, page.title || settings.site_name, settings, '/')
}

export default async function HomePage() {
  const page = await getPageBySlug('home')
  if (!page) notFound()

  return (
    <div data-theme={page.theme}>
      <RenderPage data={page.blocks ?? { content: [], root: {} }} />
    </div>
  )
}
