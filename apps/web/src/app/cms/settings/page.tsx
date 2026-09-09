import { Settings, Save, Globe, Shield, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CmsSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">CMS &amp; Publishing Settings</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Global site configuration, domain routing, edge cache rules, and Puck editor block defaults.
          </p>
        </div>

        <Button size="sm" className="gap-1.5 text-xs bg-[var(--orange)] hover:bg-[var(--orange-dk)] text-white">
          <Save className="h-3.5 w-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#1B4FD8]" />
              <span>Public Site Identity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">Brand Name</label>
              <input
                type="text"
                defaultValue="GCC Startup"
                className="w-full rounded-lg border border-[var(--border)] bg-slate-50 p-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--orange)] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--text)] mb-1">Production Domain</label>
              <input
                type="text"
                defaultValue="https://gccstartup.com"
                className="w-full rounded-lg border border-[var(--border)] bg-slate-50 p-2.5 text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--orange)] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--text)] mb-1">Default Tagline</label>
              <input
                type="text"
                defaultValue="International Company Formation, Tax &amp; Banking in Dubai &amp; the GCC"
                className="w-full rounded-lg border border-[var(--border)] bg-slate-50 p-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--orange)] focus:bg-white"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Content Edge Cache &amp; Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">Cloudflare R2 Bucket Name</label>
              <input
                type="text"
                defaultValue="gcc-production-assets"
                readOnly
                className="w-full rounded-lg border border-[var(--border)] bg-slate-100 p-2.5 text-xs text-slate-600 font-mono outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--text)] mb-1">Public CDN CNAME</label>
              <input
                type="text"
                defaultValue="https://cdn.gccstartup.com"
                readOnly
                className="w-full rounded-lg border border-[var(--border)] bg-slate-100 p-2.5 text-xs text-slate-600 font-mono outline-none cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Purge Entire Edge Cache</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
