import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  Eye,
  PenSquare,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const samplePosts = [
  {
    id: 'post_1',
    title: 'UAE Corporate Tax 2026: Qualifying Free Zone Person (QFZP) Master Guide',
    slug: '/blog/uae-corporate-tax-qfzp-guide',
    category: 'Corporate Tax',
    status: 'published',
    readTime: '6 min read',
    publishedAt: '2 days ago',
    views: '1,420',
  },
  {
    id: 'post_2',
    title: 'Dubai IFZA vs Meydan vs DMCC: 2026 Freezone Cost & Activity Comparison',
    slug: '/blog/dubai-freezone-cost-comparison',
    category: 'Incorporation',
    status: 'published',
    readTime: '8 min read',
    publishedAt: '5 days ago',
    views: '3,890',
  },
  {
    id: 'post_3',
    title: 'Saudi Arabia Regional Headquarters (RHQ) 30-Year Tax Exemption Framework',
    slug: '/blog/saudi-rhq-tax-exemption-rules',
    category: 'Saudi Expansion',
    status: 'published',
    readTime: '5 min read',
    publishedAt: '1 week ago',
    views: '2,150',
  },
  {
    id: 'post_4',
    title: 'Opening a UAE Corporate Bank Account: Ultimate Checklist for Foreign Founders',
    slug: '/blog/opening-uae-corporate-bank-account',
    category: 'Banking',
    status: 'draft',
    readTime: '10 min read',
    publishedAt: 'In Draft',
    views: '—',
  },
]

export default function CmsPostsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Blog &amp; Intelligence Articles</h1>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              Thought Leadership
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Publish authoritative guides, regulatory tax breakdowns, and GCC company formation advisories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-[var(--orange)] hover:bg-[var(--orange-dk)] text-white">
            <Plus className="h-3.5 w-3.5" />
            <span>New Article</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Total Articles</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[var(--text)]">156</div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Published across hubs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Total Organic Views</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[#1B4FD8]">48.2k</div>
            <p className="text-[11px] text-[#1B4FD8] mt-0.5">Past 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Lead Magnet Conversions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-emerald-600">812</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Direct CRM sync</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">AEO Search Readiness</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-purple-600">96%</div>
            <p className="text-[11px] text-purple-700 mt-0.5">Perplexity &amp; ChatGPT cited</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <PenSquare className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-xs font-bold text-[var(--text)]">All Regulatory Articles</span>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full rounded-lg border border-[var(--border)] bg-white py-1.5 pl-8 pr-3 text-xs text-[var(--text)] placeholder-slate-400 outline-none focus:border-[var(--orange)]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                <th className="py-2.5 px-4">Title &amp; URL</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Reading Time</th>
                <th className="py-2.5 px-4">Organic Views</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {samplePosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[var(--text)] line-clamp-1">{post.title}</div>
                    <div className="font-mono text-[11px] text-slate-400">{post.slug}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-[var(--border)]">
                      {post.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {post.status === 'published' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                    {post.readTime}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                    {post.views}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button size="xs" variant="outline" className="text-[11px]">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
