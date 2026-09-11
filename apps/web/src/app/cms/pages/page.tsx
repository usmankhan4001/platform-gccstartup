'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  ExternalLink,
  Edit3,
  Search,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type Page = {
  id: string
  title: string
  slug: string
  status: string
  author: string | null
  blocksCount: number
  updated_at: string
}

export default function CmsPagesPage() {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/cms/pages')
      const json = await res.json()
      if (json.data) setPages(json.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, slug: newSlug }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setShowCreate(false)
        router.push(`/cms/pages/${json.data.id}/edit`)
      } else {
        alert(json.error || 'Failed to create page')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating page')
    }
  }

  const publishedCount = pages.filter(p => p.status === 'published').length
  const draftCount = pages.filter(p => p.status === 'draft').length

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
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs bg-[var(--orange)] hover:bg-[var(--orange-dk)] text-white">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Page</span>
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="mb-6 border-2 border-[var(--orange)]">
          <CardHeader>
            <CardTitle>Create New Page</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">Page Title</label>
                <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="e.g. Dubai Freezone 2026" />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">Slug (Route)</label>
                <input required value={newSlug} onChange={e => setNewSlug(e.target.value)} className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="e.g. /dubai-freezone" />
              </div>
              <Button type="submit" className="bg-[var(--orange)] text-white">Create & Edit</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Total Pages</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[var(--text)]">{pages.length}</div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Across GCC regions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Published Live</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-emerald-600">{publishedCount}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Edge indexed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Drafts &amp; Staging</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-amber-600">{draftCount}</div>
            <p className="text-[11px] text-amber-700 mt-0.5">In content review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Active Block Types</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[#1B4FD8]">56+</div>
            <p className="text-[11px] text-[#1B4FD8] mt-0.5">Interactive components</p>
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
              {loading && <tr><td colSpan={6} className="py-4 text-center">Loading...</td></tr>}
              {!loading && pages.length === 0 && <tr><td colSpan={6} className="py-4 text-center">No pages found.</td></tr>}
              {!loading && pages.map((page) => (
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
                        {page.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                    {page.author || 'Unknown'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-[var(--border)]">
                      {page.blocksCount} blocks
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--text-tertiary)]">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/cms/pages/${page.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit Puck</span>
                      </Link>
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
