import Link from 'next/link'
import {
  FileText,
  Plus,
  ExternalLink,
  Edit3,
  MoreVertical,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const samplePages = [
  {
    id: 'page_1',
    title: 'GCC Startup Homepage',
    slug: '/',
    status: 'published',
    updatedAt: '2 hours ago',
    author: 'Editorial Team',
    blocksCount: 14,
  },
  {
    id: 'page_2',
    title: 'Dubai Freezone Setup Guide',
    slug: '/dubai-freezone',
    status: 'published',
    updatedAt: 'Yesterday',
    author: 'Senior Partner',
    blocksCount: 18,
  },
  {
    id: 'page_3',
    title: 'Saudi Arabia RHQ & MISA Formation',
    slug: '/saudi-rhq',
    status: 'published',
    updatedAt: '3 days ago',
    author: 'Legal Ops',
    blocksCount: 16,
  },
  {
    id: 'page_4',
    title: 'Qatar LLC Corporate Structuring',
    slug: '/qatar-llc',
    status: 'published',
    updatedAt: '4 days ago',
    author: 'Legal Ops',
    blocksCount: 12,
  },
  {
    id: 'page_5',
    title: 'UAE Corporate Banking Assistance',
    slug: '/uae-banking',
    status: 'published',
    updatedAt: '1 week ago',
    author: 'Financial Advisory',
    blocksCount: 10,
  },
  {
    id: 'page_6',
    title: 'Philippines Partner Channel 2026',
    slug: '/partners/philippines',
    status: 'draft',
    updatedAt: 'Just now',
    author: 'Partner Strategy',
    blocksCount: 8,
  },
]

export default function CmsPagesPage() {
  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Landing Pages &amp; Puck Blocks</h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Puck Visual Editor
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Build and manage high-conversion landing pages using 55+ production-grade GCC blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-[var(--orange)] hover:bg-[var(--orange-dk)] text-white">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Page</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Total Pages</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[var(--text)]">24</div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Across GCC regions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Published Live</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-emerald-600">21</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Edge indexed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Drafts &amp; Staging</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-amber-600">3</div>
            <p className="text-[11px] text-amber-700 mt-0.5">In content review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Active Block Types</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[#1B4FD8]">55+</div>
            <p className="text-[11px] text-[#1B4FD8] mt-0.5">Interactive calculators &amp; quizzes</p>
          </CardContent>
        </Card>
      </div>

      {/* Pages Table */}
      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-xs font-bold text-[var(--text)]">Published &amp; Draft Landing Pages</span>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by title or slug..."
              className="w-full rounded-lg border border-[var(--border)] bg-white py-1.5 pl-8 pr-3 text-xs text-[var(--text)] placeholder-slate-400 outline-none focus:border-[var(--orange)]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                <th className="py-2.5 px-4">Page Title &amp; Route</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Author</th>
                <th className="py-2.5 px-4">Blocks</th>
                <th className="py-2.5 px-4">Last Modified</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {samplePages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[var(--text)]">{page.title}</div>
                    <div className="font-mono text-[11px] text-slate-400">{page.slug}</div>
                  </td>
                  <td className="py-3 px-4">
                    {page.status === 'published' ? (
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
                    {page.author}
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-[var(--border)]">
                      {page.blocksCount} blocks
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--text-tertiary)]">
                    {page.updatedAt}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="xs" variant="outline" className="gap-1 text-[11px]">
                        <Edit3 className="h-3 w-3" />
                        <span>Edit Puck</span>
                      </Button>
                      <a
                        href={page.slug}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-slate-100 hover:text-[var(--text)]"
                        title="View Live Page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
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
