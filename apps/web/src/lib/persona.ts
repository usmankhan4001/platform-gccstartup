export type PersonaTag = 'startup-founder' | 'expanding-business' | 'investor' | 'digital-nomad' | 'enterprise'
export function classifyPersona(data: Record<string, any>): PersonaTag { return 'startup-founder' }
export type IndustryRiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export const industryRiskTier = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' } as const