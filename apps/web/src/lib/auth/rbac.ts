export function requireRole(role: string) { return async (request: any) => { return { userId: "stub", role: "admin" } } }

export const requireAuth = requireRole
