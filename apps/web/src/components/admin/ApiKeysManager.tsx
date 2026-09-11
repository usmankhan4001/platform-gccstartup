'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { KeyRound, Plus, Trash2, Copy, Check, ShieldOff, Search, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { adminFetch, formatDate } from './api'

type ApiKey = {
  id: string
  name: string
  keyPrefix: string
  permissions: string[] | null
  rateLimit: number
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

const PERMISSION_GROUPS: { label: string; options: string[] }[] = [
  { label: 'CRM', options: ['contacts:read', 'contacts:write', 'deals:read', 'deals:write'] },
  { label: 'Conversations', options: ['conversations:read', 'conversations:write'] },
  { label: 'Campaigns', options: ['campaigns:read', 'campaigns:write'] },
  { label: 'Content', options: ['templates:read', 'templates:write', 'documents:read', 'documents:write'] },
  { label: 'Automation', options: ['flows:read', 'flows:write'] },
  { label: 'Platform', options: ['analytics:read', 'webhooks:read', 'webhooks:write'] },
]

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>(['contacts:read'])
  const [rateLimit, setRateLimit] = useState('1000')
  const [expiresAt, setExpiresAt] = useState('')

  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKey | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setKeys(await adminFetch<ApiKey[]>('/api/admin/api-keys'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function createKey() {
    setBusy(true)
    setError(null)
    try {
      const created = await adminFetch<{ token: string }>('/api/admin/api-keys', {
        method: 'POST',
        json: { name, permissions: selected, rateLimit: Number(rateLimit) || undefined, expiresAt: expiresAt || undefined },
      })
      setCreatedToken(created.token)
      setCreateOpen(false)
      setName('')
      setSelected(['contacts:read'])
      setRateLimit('1000')
      setExpiresAt('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key')
    } finally {
      setBusy(false)
    }
  }

  async function revokeKey(key: ApiKey) {
    setBusy(true)
    setError(null)
    try {
      await adminFetch(`/api/admin/api-keys/${key.id}`, { method: 'DELETE' })
      setConfirmRevoke(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key')
    } finally {
      setBusy(false)
    }
  }

  function togglePermission(permission: string) {
    setSelected((prev) => (prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]))
  }

  const filteredKeys = useMemo(() => {
    if (!keys) return []
    const q = search.trim().toLowerCase()
    if (!q) return keys
    return keys.filter((k) => k.name.toLowerCase().includes(q) || k.keyPrefix.toLowerCase().includes(q))
  }, [keys, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">API Keys</h1>
          <p className="mt-1 text-sm text-text-secondary">Scoped bearer tokens for the /api/v2 REST API. Keys are SHA-256 hashed at rest.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Search keys..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Key
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <div className="rounded-xl border border-border bg-bg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-secondary text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                <th className="py-3 px-4">Name &amp; Prefix</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Rate Limit</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-text">
              {keys === null ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-text-secondary">Loading keys…</td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <EmptyState
                      icon={KeyRound}
                      title="No API keys yet"
                      description="Generate a key to let external services call the Platform API. You choose exactly which resources it can read or write."
                      action={
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Generate your first key
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-text-secondary">
                    No keys found matching &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((key) => {
                  const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date()
                  return (
                    <tr key={key.id} className="hover:bg-bg-secondary transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-text block">{key.name}</span>
                        <span className="font-mono text-[10px] text-text-tertiary">{key.keyPrefix}…</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={key.isActive ? (isExpired ? 'warning' : 'success') : 'default'} size="sm">
                          {!key.isActive ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(key.permissions ?? []).map((permission) => (
                            <Badge key={permission} variant="info" size="sm" className="text-[9px]">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-text-secondary">
                        {key.rateLimit.toLocaleString()} / min
                      </td>
                      <td className="py-3.5 px-4 text-text-tertiary">
                        {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}
                        {key.expiresAt && <span className="block mt-0.5 text-[10px]">Exp: {formatDate(key.expiresAt)}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {key.isActive && (
                          <Button variant="outline" size="xs" onClick={() => setConfirmRevoke(key)} disabled={busy} className="text-danger hover:text-danger hover:bg-danger-lt border-danger-border">
                            <Trash2 className="mr-1.5 h-3 w-3" />
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>The full token is shown once after creation — store it somewhere safe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input label="Key name" id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Portal integration" />
            <div>
              <p className="mb-2 text-sm font-medium text-text">Permission scopes</p>
              <div className="space-y-3">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{group.label}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {group.options.map((permission) => (
                        <button
                          key={permission}
                          type="button"
                          onClick={() => togglePermission(permission)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            selected.includes(permission)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-text-secondary hover:border-primary/40'
                          }`}
                        >
                          {permission}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Rate limit (req/min)" id="key-rate" type="number" min={1} max={10000} value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} />
              <Input label="Expires (optional)" id="key-expiry" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createKey} disabled={!name.trim() || selected.length === 0 || busy}>
              {busy ? 'Creating…' : 'Generate key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-time token reveal */}
      <Dialog open={createdToken !== null} onOpenChange={(open) => !open && setCreatedToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your API key now</DialogTitle>
            <DialogDescription>
              This is the only time the full token is shown. It is stored hashed and cannot be retrieved again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-text">{createdToken}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(createdToken ?? '')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedToken(null)}>I&apos;ve stored it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <Dialog open={confirmRevoke !== null} onOpenChange={(open) => !open && setConfirmRevoke(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke “{confirmRevoke?.name}”?</DialogTitle>
            <DialogDescription>
              Requests signed with this key will immediately receive 401 responses. This cannot be undone — generate a new key to restore access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confirmRevoke && revokeKey(confirmRevoke)} disabled={busy}>
              <ShieldOff className="mr-2 h-4 w-4" />
              Revoke key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
