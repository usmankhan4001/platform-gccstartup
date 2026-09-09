import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPostBySlug, getSiteSettings } from '@/lib/directus'
import { buildMetadata } from '@/lib/seo'
import { buildHreflangAlternates } from '@/lib/seo-alternates'
import { RenderPage } from '@/puck/RenderPage'
import { Eyebrow } from '@/components/ui'
import { PageCta } from '@/components/PageCta'
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { sanitizeRichTextHtml } from '@/lib/sanitize-html'
import { Calendar, Clock, ChevronRight } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()])
  if (!post) return {}
  const metadata = buildMetadata({ ...post, seo_meta_description: post.seo_meta_description || post.excerpt }, post.title, settings, `/blog/${slug}`)
  if (settings.site_url) {
    const translatedLocales = Object.keys(post.translations ?? {})
    metadata.alternates = { ...metadata.alternates, languages: buildHreflangAlternates(settings.site_url, `/blog/${slug}`, translatedLocales) }
  }
  return metadata
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()])
  if (!post) notFound()

  const base = (settings.site_url || '').replace(/\/$/, '')
  const url = `${base}/blog/${post.slug}`

  return (
    <article style={{ background: 'var(--bg)' }}>
      <ArticleJsonLd
        title={post.title}
        description={post.seo_meta_description || post.excerpt}
        url={url}
        publishedAt={post.published_at}
        settings={settings}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: settings.site_url || '/' },
          { name: 'Blog', url: `${base}/blog` },
          { name: post.title, url },
        ]}
      />
      
      {post.blocks && <RenderPage data={post.blocks} />}

      <div className="wrap-narrow" style={{ padding: 'var(--section-y) 0' }}>
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 13,
            color: 'var(--text-tertiary)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <Link href="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
          <ChevronRight size={14} aria-hidden />
          <Link href="/blog" style={{ color: 'var(--text-secondary)' }}>Blog</Link>
          <ChevronRight size={14} aria-hidden />
          <span style={{ color: 'var(--orange)', fontWeight: 600 }}>{post.category || 'Article'}</span>
        </nav>

        {post.category && <Eyebrow>{post.category}</Eyebrow>}
        <h1 style={{ marginBottom: 'var(--space-4)' }}>{post.title}</h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            color: 'var(--text-tertiary)',
            fontSize: 14,
            marginBottom: 'var(--space-8)',
            paddingBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {post.published_at && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} aria-hidden />
              {new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
          {post.reading_time && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} aria-hidden />
              {post.reading_time} min read
            </span>
          )}
        </div>

        {post.cover_image && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              marginBottom: 'var(--space-10)',
              boxShadow: 'var(--shadow-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 900px) 840px, 100vw"
              quality={85}
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div
          className="prose"
          style={{ marginTop: 'var(--space-6)' }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(post.content) }}
        />

        {post.tags && post.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-12)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', marginRight: 'var(--space-2)' }}>
              TAGS:
            </span>
            {post.tags.map((t: any, i: number) => (
              <span key={i} className="badge badge-accent">
                {t?.tag || t}
              </span>
            ))}
          </div>
        )}
      </div>

      <RelatedLinks internalLinks={post.internal_links} externalCitations={post.external_citations} />

      <PageCta
        eyebrow="Free consultation"
        headline="Ready to start your company?"
        description={`Enjoyed "${post.title}"? Get a personalized setup plan from a specialist — no obligation.`}
        source={`Blog Post: ${post.title}`}
        interest={post.category || undefined}
      />
    </article>
  )
}
