'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminFetch } from './api'

type RoleRow = {
  id: string
  name: string
  description: string | null
  userCount: number
  permissions: { name: string; description: string | null }[]
  createdAt: string
}

/** The code-enforced ladder — always true, independent of table contents. */
const BUILT_IN_ROLES = [
  { name: 'super_admin', description: 'Full system access, including every resource and action' },
  { name: 'admin', description: 'Manage users, CRM, content, campaigns and settings' },
  { name: 'staff', description: 'Work contacts, deals, content and campaigns — no user management' },
  { name: 'viewer', description: 'Read-only access to CRM and reports' },
]

export function RolesView() {
  const [roles, setRoles] = useState<RoleRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setRoles(await adminFetch<RoleRow[]>('/api/admin/roles'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Roles &amp; Permissions</h1>
        <p className="text-sm text-text-secondary">
          Session access is enforced by the built-in RBAC ladder in code; the roles table below mirrors it for API-scoped grants.
        </p>
      </div>

      {error && <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {BUILT_IN_ROLES.map((role) => {
          const dbRole = roles?.find((r) => r.name.toLowerCase().replace(' ', '_') === role.name)
          return (
            <div key={role.name} className="rounded-lg border border-border bg-bg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-text">{role.name}</h3>
                </div>
                <Badge variant={role.name === 'super_admin' ? 'accent' : 'info'} size="sm">
                  {dbRole ? `${dbRole.userCount} user${dbRole.userCount === 1 ? '' : 's'}` : 'built-in'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{role.description}</p>
              {dbRole && dbRole.permissions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {dbRole.permissions.map((permission) => (
                    <Badge key={permission.name} variant="default" size="sm">
                      {permission.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {roles !== null && roles.length === 0 && (
        <EmptyState
          icon={ShieldOff}
          title="No custom roles in the database"
          description="The four built-in roles above are enforced in code and need no rows. Custom roles can be added to the roles table when API-scoped grants need them."
        />
      )}
    </div>
  )
}
