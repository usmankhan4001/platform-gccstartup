import {
  Search,
  CheckCircle2,
  AlertCircle,
  Globe,
  Share2,
  Bot,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CmsSeoPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">SEO &amp; Answer Engine Optimization (AEO)</h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Score: 94/100
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Optimize search crawlability, Schema.org JSON-LD microdata, OpenGraph cards, and AI engine citation answers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Re-Index Sitemap</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Google Search Health</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-emerald-600">100%</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">0 crawl errors reported</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">AEO Answer Readability</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[#1B4FD8]">92%</div>
            <p className="text-[11px] text-[#1B4FD8] mt-0.5">Optimized for AI LLM summaries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Schema JSON-LD</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-purple-600">Valid</div>
            <p className="text-[11px] text-purple-700 mt-0.5">Organization, FAQ &amp; Product schemas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-[var(--text-secondary)]">Canonical Coverage</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-[var(--text)]">100%</div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Strict HTTPS &amp; www redirects</p>
          </CardContent>
        </Card>
      </div>

      {/* Checklist & Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Search Engine Endpoints</span>
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-slate-50">
              <div>
                <p className="text-xs font-bold text-[var(--text)]">XML Sitemap Generator</p>
                <p className="text-[11px] text-[var(--text-tertiary)] font-mono">/sitemap.xml (Auto-generated from Drizzle DB)</p>
              </div>
              <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-slate-50">
              <div>
                <p className="text-xs font-bold text-[var(--text)]">Robots Directive</p>
                <p className="text-[11px] text-[var(--text-tertiary)] font-mono">/robots.txt (Disallows /admin, /api, /crm)</p>
              </div>
              <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                PROTECTED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-slate-50">
              <div>
                <p className="text-xs font-bold text-[var(--text)]">OpenGraph &amp; Twitter Cards</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Dynamic 1200×630 OG image generation</p>
              </div>
              <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                HEALTHY
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-[var(--orange)]" />
            <span>Answer Engine Optimization (AEO) Readiness</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            AI engines like ChatGPT Search and Perplexity extract verified corporate formation answers directly from structured blocks.
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>QFZP tax exemption criteria explicitly marked in FAQ Schema</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Freezone pricing tables formatted with itemized government fees</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Entity verification and Dubai DIFC address schema verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
