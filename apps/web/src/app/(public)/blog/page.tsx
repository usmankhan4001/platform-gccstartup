import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPosts, getSiteSettings } from '@/lib/directus'
import { Eyebrow } from '@/components/ui'
import { ArrowRight, Clock, Calendar } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Blog & Tax Insights',
    description: `Jurisdiction guides, tax strategy, and company-formation insights from ${settings.site_name}.`,
    alternates: { canonical: '/blog' },
  }
}

export default async function BlogIndexPage() {
  const posts = await getPosts()

  return (
    <div className="section" style={{ background: 'var(--bg)' }}>
      <div className="wrap">
        <div className="max-w-xl text-center" style={{ marginBottom: 'var(--space-12)' }}>
          <Eyebrow>Insights & Tax Strategy</Eyebrow>
          <h1>Company Formation & Tax Insights</h1>
          <p className="text-lg" style={{ marginTop: 'var(--space-3)' }}>
            Expert guides on legal 0% tax structures, offshore banking, UAE residency, and international incorporation.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="card reveal"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                {post.cover_image ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16 / 9',
                      overflow: 'hidden',
                      background: 'var(--surface-alt)',
                    }}
                  >
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                      quality={80}
                      style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16 / 9',
                      background: 'linear-gradient(135deg, var(--surface-alt), var(--orange-lt))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)' }}>
                      GCC Startup Insights
                    </span>
                  </div>
                )}

                <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-3)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="badge badge-accent">
                      {post.category || 'Tax & Formation'}
                    </span>
                    {post.published_at && (
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-tertiary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Calendar size={12} aria-hidden />
                        {new Date(post.published_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 20, marginBottom: 'var(--space-2)', lineHeight: 1.35 }}>
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p
                      style={{
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        flex: 1,
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      {post.excerpt}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 'var(--space-4)',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--orange)',
                    }}
                  >
                    <span>Read Article</span>
                    <ArrowRight size={16} aria-hidden />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
            <h3>No articles published yet</h3>
            <p style={{ marginTop: 'var(--space-2)' }}>Check back soon for new tax strategy and incorporation guides.</p>
          </div>
        )}
      </div>
    </div>
  )
}
