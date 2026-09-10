import { describe, it, expect } from 'vitest'
import { hasPermission, canAccess, getRoleLevel, type Role } from '@gccstartup/shared'

/**
 * The full role × permission matrix for the built-in RBAC ladder. Sessions are
 * gated by this ladder (lib/auth/session.ts), so every cell here is a contract
 * the admin UI and API rely on.
 */
const MATRIX: Array<{ role: Role; allowed: string[]; denied: string[] }> = [
  {
    role: 'super_admin',
    allowed: ['users:read', 'users:delete', 'contacts:write', 'deals:delete', 'content:publish', 'campaigns:dispatch', 'settings:update', 'anything:at-all'],
    denied: [],
  },
  {
    role: 'admin',
    allowed: ['users:create', 'users:read', 'users:update', 'users:delete', 'contacts:create', 'contacts:read', 'contacts:update', 'contacts:delete', 'deals:create', 'deals:delete', 'content:publish', 'campaigns:dispatch', 'settings:read', 'settings:update', 'reports:read'],
    denied: ['nonexistent:action'],
  },
  {
    role: 'staff',
    allowed: ['contacts:create', 'contacts:read', 'contacts:update', 'deals:create', 'deals:read', 'deals:update', 'content:create', 'content:update', 'campaigns:create', 'campaigns:update', 'reports:read'],
    denied: ['contacts:delete', 'deals:delete', 'users:read', 'users:create', 'settings:read', 'settings:update', 'content:publish', 'campaigns:dispatch'],
  },
  {
    role: 'viewer',
    allowed: ['contacts:read', 'deals:read', 'content:read', 'reports:read'],
    denied: ['contacts:create', 'contacts:update', 'contacts:delete', 'deals:create', 'deals:update', 'users:read', 'settings:read', 'content:publish', 'campaigns:create'],
  },
]

describe('RBAC role × permission matrix', () => {
  for (const { role, allowed, denied } of MATRIX) {
    it(`${role} grants exactly its documented permissions`, () => {
      for (const permission of allowed) expect(hasPermission(role, permission)).toBe(true)
      for (const permission of denied) expect(hasPermission(role, permission)).toBe(false)
    })
  }

  it('only super_admin holds the implicit wildcard', () => {
    expect(hasPermission('super_admin', 'anything:at-all')).toBe(true)
    // admin is broad but has no wildcard resource
    expect(hasPermission('admin', 'anything:at-all')).toBe(false)
  })

  it('malformed permission strings are denied', () => {
    expect(hasPermission('admin', 'contacts')).toBe(false)
    expect(hasPermission('admin', '')).toBe(false)
    expect(hasPermission('admin', ':read')).toBe(false)
  })

  it('canAccess mirrors hasPermission for resource/action pairs', () => {
    expect(canAccess('staff', 'contacts', 'create')).toBe(true)
    expect(canAccess('staff', 'contacts', 'delete')).toBe(false)
    expect(canAccess('viewer', 'deals', 'update')).toBe(false)
    expect(canAccess('super_admin', 'anything', 'at-all')).toBe(true)
  })
})

describe('RBAC hierarchy', () => {
  it('orders roles super_admin > admin > staff > viewer', () => {
    expect(getRoleLevel('super_admin')).toBeGreaterThan(getRoleLevel('admin'))
    expect(getRoleLevel('admin')).toBeGreaterThan(getRoleLevel('staff'))
    expect(getRoleLevel('staff')).toBeGreaterThan(getRoleLevel('viewer'))
    expect(getRoleLevel('viewer')).toBe(0)
  })

  it('unknown roles sit below viewer', () => {
    expect(getRoleLevel('unknown' as Role)).toBe(-1)
  })
})
