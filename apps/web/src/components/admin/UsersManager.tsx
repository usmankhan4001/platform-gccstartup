'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserPlus, Users as UsersIcon, Copy, Check, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
import { adminFetch, formatDate } from './api'

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string | null
  isActive: boolean
  emailVerified: boolean
  createdAt: string
}

const ROLES = ['viewer', 'staff', 'admin', 'super_admin'] as const

function roleTone(role: string | null): 'accent' | 'info' | 'success' | 'default' {
  switch (role) {
    case 'super_admin':
      return 'accent'
    case 'admin':
      return 'info'
    case 'staff':
      return 'success'
    default:
      return 'default'
  }
}

export function UsersManager() {
  const [users, setUsers] = useState<UserRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('viewer')

  const [invited, setInvited] = useState<{ email: string; tempPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setUsers(await adminFetch<UserRow[]>('/api/admin/users'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function invite() {
    setBusy(true)
    setError(null)
    try {
      const created = await adminFetch<{ email: string; tempPassword: string }>('/api/admin/users', {
        method: 'POST',
        json: { email, name: name || undefined, role },
      })
      setInvited(created)
      setInviteOpen(false)
      setEmail('')
      setName('')
      setRole('viewer')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user')
    } finally {
      setBusy(false)
    }
  }

  async function setUserActive(user: UserRow, isActive: boolean) {
    setBusy(true)
    setError(null)
    try {
      await adminFetch(`/api/admin/users/${user.id}`, { method: 'PATCH', json: { isActive } })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setBusy(false)
    }
  }

  async function setUserRole(user: UserRow, newRole: string) {
    setBusy(true)
    setError(null)
    try {
      await adminFetch(`/api/admin/users/${user.id}`, { method: 'PATCH', json: { role: newRole } })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Users</h1>
          <p className="text-sm text-text-secondary">Team accounts for the CRM, CMS and admin hubs. Roles follow the built-in RBAC ladder.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {error && <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="rounded-lg border border-border bg-bg">
        {users === null ? (
          <div className="p-8 text-center text-sm text-text-secondary">Loading users…</div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No user accounts yet"
            description="Invite your first teammate. They receive a temporary password you can share securely over your password manager."
            action={
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite a user
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-text">{user.name || user.email}</h3>
                    <Badge variant={roleTone(user.role)} size="sm">
                      {user.role || 'unassigned'}
                    </Badge>
                    <Badge variant={user.isActive ? 'success' : 'default'} size="sm">
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                    {!user.emailVerified && (
                      <Badge variant="warning" size="sm">
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{user.email}</p>
                  <p className="mt-1 text-xs text-text-tertiary">Joined {formatDate(user.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Select aria-label={`Role for ${user.email}`} value={user.role || 'viewer'} onChange={(e) => setUserRole(user, e.target.value)} disabled={busy} className="w-36">
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                  {user.isActive ? (
                    <Button variant="outline" size="sm" onClick={() => setUserActive(user, false)} disabled={busy}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setUserActive(user, true)} disabled={busy}>
                      Reactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>An account is created immediately with a generated temporary password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input label="Email" id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
            <Input label="Name (optional)" id="invite-name" value={name} onChange={(e) => setName(e.target.value)} />
            <Select label="Role" id="invite-role" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={invite} disabled={!email.trim() || busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-time password reveal */}
      <Dialog open={invited !== null} onOpenChange={(open) => !open && setInvited(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account created</DialogTitle>
            <DialogDescription>
              Share this temporary password with {invited?.email} through a secure channel. It is not stored in plaintext and cannot be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-text">{invited?.tempPassword}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(invited?.tempPassword ?? '')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setInvited(null)}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
