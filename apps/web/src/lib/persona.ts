export type PersonaTag = 'startup-founder' | 'expanding-business' | 'investor' | 'digital-nomad' | 'enterprise'
export function classifyPersona(data: Record<string, any>): PersonaTag { return 'startup-founder' }
