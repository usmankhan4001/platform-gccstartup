'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Send, Activity, RefreshCw, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { adminFetch, formatDate } from './api'

type Webhook = {
  id: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: string | null
  failureCount: number
  createdAt: string
  deliveries: { total: number; delivered: number; failed: number }
}

type Delivery = {
  id: string
  eventType: string
  status: string
  attempts: number
  responseStatus: number | null
  lastError: string | null
  createdAt: string
}

const WEBHOOK_EVENTS = [
  'contact.created',
  'contact.updated',
  'contact.stage_changed',
  'deal.created',
  'deal.won',
  'deal.lost',
  'lead.captured',
  'lead.converted',
  'message.received',
  'conversation.assigned',
  'campaign.dispatched',
  'campaign.completed',
  'email.sent',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'ticket.created',
  'ticket.resolved',
  'flow.enrollment_created',
  'flow.completed',
  'order.paid',
  'order.payment_failed',
  'user.created',
  'user.role_changed',
]

function deliveryTone(status: string): 'success' | 'danger' | 'warning' | 'default' {
  if (status === 'delivered') return 'success'
  if (status === 'failed') return 'danger'
  return 'warning'
}

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [selected, setSelected] = useState<string[]>(['lead.captured'])
  const [customSecret, setCustomSecret] = useState('')

  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<{ url: string; status: string; responseStatus: number | null; error: string | null } | null>(null)
  const [deliveriesFor, setDeliveriesFor] = useState<{ url: string; rows: Delivery[] } | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setWebhooks(await adminFetch<Webhook[]>('/api/admin/webhooks'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function createWebhook() {
    setBusy(true)
    setError(null)
    try {
      const created = await adminFetch<{ secret: string }>('/api/admin/webhooks', {
        method: 'POST',
        json: { url, events: selected, secret: customSecret || undefined },
      })
      setCreatedSecret(created.secret)
      setCreateOpen(false)
      setUrl('')
      setSelected(['lead.captured'])
      setCustomSecret('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook')
    } finally {
      setBusy(false)
    }
  }

  async function toggleWebhook(webhook: Webhook) {
    setBusy(true)
    setError(null)
    try {
      await adminFetch(`/api/admin/webhooks/${webhook.id}`, { method: 'PATCH', json: { isActive: !webhook.isActive } })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook')
    } finally {
      setBusy(false)
    }
  }

  async function deleteWebhook(webhook: Webhook) {
    setBusy(true)
    setError(null)
    try {
      await adminFetch(`/api/admin/webhooks/${webhook.id}`, { method: 'DELETE' })
      setNotice(`Webhook ${webhook.url} removed.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook')
    } finally {
      setBusy(false)
    }
  }

  async function testWebhook(webhook: Webhook) {
    setBusy(true)
    setError(null)
    setTestResult(null)
    try {
      const result = await adminFetch<{ status: string; responseStatus: number | null; error: string | null }>(
        `/api/admin/webhooks/${webhook.id}/test`,
        { method: 'POST' },
      )
      setTestResult({ url: webhook.url, ...result })
      await load()
    } catch (err) {
      // A failed delivery surfaces as 502 with the delivery recorded — show it honestly.
      setTestResult({ url: webhook.url, status: 'failed', responseStatus: null, error: err instanceof Error ? err.message : 'Test delivery failed' })
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function showDeliveries(webhook: Webhook) {
    setDeliveriesFor(null)
    setError(null)
    try {
      const rows = await adminFetch<Delivery[]>(`/api/admin/webhooks/${webhook.id}/deliveries`)
      setDeliveriesFor({ url: webhook.url, rows })
    } catch {
      setDeliveriesFor({ url: webhook.url, rows: [] })
    }
  }

  function toggleEvent(event: string) {
    setSelected((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Webhooks</h1>
          <p className="text-sm text-text-secondary">
            Outbound POSTs signed with HMAC-SHA256 (<code className="font-mono text-xs">X-Webhook-Signature: sha256=…</code>) whenever subscribed events fire.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {error && <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>}
      {notice && <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-sm text-text-secondary">{notice}</div>}
      {testResult && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            testResult.status === 'delivered' ? 'border-green-border bg-green-lt text-green-dk' : 'border-danger-border bg-danger-lt text-danger'
          }`}
        >
          Test delivery to <span className="font-mono text-xs">{testResult.url}</span>:{' '}
          {testResult.status === 'delivered' ? `delivered (HTTP ${testResult.responseStatus})` : `failed — ${testResult.error || 'endpoint unreachable'}`}
        </div>
      )}

      <div className="rounded-lg border border-border bg-bg">
        {webhooks === null ? (
          <div className="p-8 text-center text-sm text-text-secondary">Loading webhooks…</div>
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No webhook endpoints yet"
            description="Register an https endpoint and pick the platform events it should receive. A signing secret is generated for verifying payloads."
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first endpoint
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-all font-medium text-text">{webhook.url}</h3>
                      <Badge variant={webhook.isActive ? 'success' : 'default'} size="sm">
                        {webhook.isActive ? 'Active' : 'Paused'}
                      </Badge>
                      {webhook.failureCount > 0 && (
                        <Badge variant="warning" size="sm">
                          {webhook.failureCount} failure{webhook.failureCount === 1 ? '' : 's'}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(webhook.events ?? []).map((event) => (
                        <Badge key={event} variant="info" size="sm">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">
                      {webhook.deliveries.total} deliveries · {webhook.deliveries.delivered} delivered · {webhook.deliveries.failed} failed · Last triggered{' '}
                      {webhook.lastTriggeredAt ? formatDate(webhook.lastTriggeredAt) : 'never'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => testWebhook(webhook)} disabled={busy}>
                      <Send className="mr-2 h-4 w-4" />
                      Test
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => showDeliveries(webhook)}>
                      Deliveries
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleWebhook(webhook)} disabled={busy}>
                      {webhook.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteWebhook(webhook)} disabled={busy}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>A signing secret is generated for HMAC-SHA256 verification and shown once.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input label="Endpoint URL" id="wh-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hooks/gcc" />
            <Input
              label="Signing secret (optional — generated if blank)"
              id="wh-secret"
              value={customSecret}
              onChange={(e) => setCustomSecret(e.target.value)}
              placeholder="whsec_…"
            />
            <div>
              <p className="mb-2 text-sm font-medium text-text">Subscribed events ({selected.length} selected)</p>
              <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-border p-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      selected.includes(event)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-text-secondary hover:border-primary/40'
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createWebhook} disabled={!url.trim() || selected.length === 0 || busy}>
              {busy ? 'Creating…' : 'Create webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-time secret reveal */}
      <Dialog open={createdSecret !== null} onOpenChange={(open) => !open && setCreatedSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save the signing secret</DialogTitle>
            <DialogDescription>Verify incoming payloads with HMAC-SHA256 over the raw body. This is the only time it is shown.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-text">{createdSecret}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(createdSecret ?? '')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedSecret(null)}>I&apos;ve stored it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery log sheet */}
      <Dialog open={deliveriesFor !== null} onOpenChange={(open) => !open && setDeliveriesFor(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery log</DialogTitle>
            <DialogDescription className="break-all">{deliveriesFor?.url}</DialogDescription>
          </DialogHeader>
          {deliveriesFor && deliveriesFor.rows.length === 0 ? (
            <EmptyState size="sm" icon={RefreshCw} title="No deliveries yet" description="Fire a test delivery to verify the endpoint end-to-end." />
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {deliveriesFor?.rows.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-text">{delivery.eventType}</p>
                    <p className="text-xs text-text-tertiary">
                      {formatDate(delivery.createdAt)}
                      {delivery.responseStatus ? ` · HTTP ${delivery.responseStatus}` : ''}
                      {delivery.lastError ? ` · ${delivery.lastError}` : ''}
                    </p>
                  </div>
                  <Badge variant={delivery.status === 'delivered' ? 'success' : delivery.status === 'failed' ? 'danger' : 'warning'} size="sm">
                    {delivery.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
