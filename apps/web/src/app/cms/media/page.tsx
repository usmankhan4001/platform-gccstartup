'use client'

import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Filter,
  Copy,
  ExternalLink,
  HardDrive,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const sampleMedia = [
  {
    id: 'med_1',
    name: 'gcc-startup-corporate-hero.webp',
    dimensions: '2400 × 1600',
    size: '284 KB',
    format: 'WEBP',
    url: 'https://cdn.gccstartup.com/assets/hero-corporate.webp',
    uploadedAt: 'Yesterday',
  },
  {
    id: 'med_2',
    name: 'difc-gate-building-dubai.webp',
    dimensions: '1920 × 1080',
    size: '195 KB',
    format: 'WEBP',
    url: 'https://cdn.gccstartup.com/assets/difc-gate.webp',
    uploadedAt: '3 days ago',
  },
  {
    id: 'med_3',
    name: 'saudi-misa-license-diagram.svg',
    dimensions: '800 × 600',
    size: '42 KB',
    format: 'SVG',
    url: 'https://cdn.gccstartup.com/assets/saudi-misa.svg',
    uploadedAt: '5 days ago',
  },
  {
    id: 'med_4',
    name: 'gcc-partners-infographic.png',
    dimensions: '1200 × 800',
    size: '410 KB',
    format: 'PNG',
    url: 'https://cdn.gccstartup.com/assets/partners.png',
    uploadedAt: '1 week ago',
  },
]

export default function CmsMediaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Cloudflare R2 Media Library</h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Edge CDN
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Global S3-compatible asset store with automatic WebP transcoding and zero egress fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 text-xs bg-[var(--orange)] hover:bg-[var(--orange-dk)] text-white">
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Assets</span>
          </Button>
        </div>
      </div>

      {/* Storage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Bucket Storage</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[var(--text)]">4.8 GB</div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Bucket: gcc-production-assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Total Media Items</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[#1B4FD8]">1,024</div>
            <p className="text-[11px] text-[#1B4FD8] mt-0.5">Images, SVGs, PDFs &amp; Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">CDN Cache Hit Ratio</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-emerald-600">99.4%</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Served from Cloudflare Edge</p>
          </CardContent>
        </Card>
      </div>

      {/* Media Grid */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets by filename or format..."
              className="w-full rounded-lg border border-[var(--border)] bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-[var(--text)] placeholder-slate-400 outline-none focus:border-[var(--orange)] focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Format: All (WebP, SVG, PNG)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {sampleMedia.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-[var(--border)] bg-slate-50 overflow-hidden hover:border-slate-400 hover:shadow-xs transition-all"
            >
              <div className="h-32 w-full bg-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-300/80 transition-colors">
                <ImageIcon className="h-8 w-8 opacity-60" />
              </div>
              <div className="p-3 bg-white border-t border-[var(--border)]">
                <p className="text-xs font-bold text-[var(--text)] truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--text-tertiary)]">
                  <span>{item.dimensions}</span>
                  <span className="font-semibold">{item.size}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                    {item.format}
                  </span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(item.url)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--orange)] hover:text-[var(--orange-dk)]"
                    title="Copy CDN Link"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy CDN</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
