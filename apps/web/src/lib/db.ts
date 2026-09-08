// Database client for the web app.
// `db` is the process-wide Drizzle instance from the shared db package —
// every API route and server module imports this and uses it directly.
import { getDb } from '@gccstartup/db'

export const db = getDb()
export * from '@gccstartup/db'
