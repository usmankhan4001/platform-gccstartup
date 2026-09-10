'use client'

import { useEffect, useState, useCallback } from 'react'
import { KeyRound, Plus, Trash2, Copy, Check, ShieldOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">API Keys</h1>
          <p className="text-sm text-text-secondary">Scoped bearer tokens for the /api/v2 REST API. Keys are SHA-256 hashed at rest.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate New Key
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <div className="rounded-lg border border-border bg-bg">
        {keys === null ? (
          <div className="p-8 text-center text-sm text-text-secondary">Loading keys…</div>
        ) : keys.length === 0 ? (
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
        ) : (
          <div className="divide-y divide-border">
            {keys.map((key) => (
              <div key={key.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-text">{key.name}</h3>
                    <Badge variant={key.isActive ? 'success' : 'default'} size="sm">
                      {key.isActive ? 'Active' : 'Revoked'}
                    </Badge>
                    {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                      <Badge variant="warning" size="sm">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs text-text-tertiary">{key.keyPrefix}…</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(key.permissions ?? []).map((permission) => (
                      <Badge key={permission} variant="info" size="sm">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-text-tertiary">
                    {key.rateLimit.toLocaleString()} req/min · Last used {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'never'}
                    {key.expiresAt ? ` · Expires ${formatDate(key.expiresAt)}` : ''}
                  </p>
                </div>
                {key.isActive && (
                  <Button variant="outline" size="sm" onClick={() => setConfirmRevoke(key)} disabled={busy}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
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
