import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { posts } from '@gccstartup/db'
import { desc, eq } from 'drizzle-orm'
import { BookOpen, Clock, Tag, ArrowRight, Sparkles } from 'lucide-react'

export const revalidate = 60

const FALLBACK_POSTS = [
  {
    id: '1',
    title: 'UAE Corporate Tax 2026: The Complete Guide to 0% QFZP & Small Business Relief',
    slug: 'uae-corporate-tax-guide-2026',
    excerpt: 'How global entrepreneurs can legally optimize corporate tax to 0% using Cabinet Decision 55 qualifying freezone activities and the AED 3,000,000 revenue threshold.',
    category: 'Corporate Tax',
    reading_time: 7,
    published_at: new Date('2026-01-15'),
    author: 'Finance Director Desk',
  },
  {
    id: '2',
    title: 'Opening a UAE Corporate Bank Account: The 2026 Approval Playbook',
    slug: 'uae-corporate-bank-account-playbook-2026',
    excerpt: 'Step-by-step checklist to achieve 99% approval odds with Wio Bank, Mashreq NeoBiz, and Emirates NBD without getting stuck in compliance review.',
    category: 'Banking',
    reading_time: 5,
    published_at: new Date('2026-02-01'),
    author: 'Banking Concierge Team',
  },
  {
    id: '3',
    title: 'Nominee UBO Structures in the UAE: Privacy, Legality, and Asset Protection',
    slug: 'nominee-ubo-privacy-uae',
    excerpt: 'Understanding the legal framework of Declarations of Trust and fiduciary directors for high-net-worth founders seeking public register confidentiality.',
    category: 'Fiduciary & Privacy',
    reading_time: 6,
    published_at: new Date('2026-02-18'),
    author: 'Legal & Structuring Advisory',
  },
  {
    id: '4',
    title: 'IFZA vs Meydan vs RAKEZ: Choosing the Best Freezone for Your SaaS or Agency',
    slug: 'ifza-vs-meydan-vs-rakez-comparison',
    excerpt: 'A granular breakdown of initial licensing fees, visa renewal costs, office lease requirements, and banking ease across top Dubai freezones.',
    category: 'Freezones',
    reading_time: 8,
    published_at: new Date('2026-03-01'),
    author: 'Formation Advisory Desk',
  },
]

export default async function BlogIndexPage() {
  let dbPosts: any[] = []
  try {
    dbPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.published_at))
      .limit(20)
  } catch (err) {
    console.error('Failed to query db posts, using fallback', err)
  }

  const displayPosts = dbPosts.length > 0 ? dbPosts : FALLBACK_POSTS

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
            Insights &amp; Intelligence
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            GCC Corporate Finance &amp; Tax Insights
          </h1>
          <p className="mt-3 text-[#334155] text-base">
            Authoritative analysis on UAE corporate tax law, banking compliance, cross-border holding structures, and GCC company formation.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {displayPosts.map((post) => (
            <article
              key={post.id}
              className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#F26522] rounded-3xl p-8 shadow-xs hover:shadow-2xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-[#EFF6FF] text-[#1B4FD8]">
                    {post.category || 'Advisory'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{post.reading_time || 5} min read</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-[#0A142F] leading-snug hover:text-[#F26522] transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>

                <p className="mt-3 text-xs text-[#334155] leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748B]">
                  By {post.author || 'Senior Advisory Desk'}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#F26522] hover:underline"
                >
                  Read Analysis <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
