/**
 * Applies Drizzle migrations. Bundled by esbuild into a self-contained
 * `migrate.mjs` so the production image does not need drizzle-kit or the
 * workspace node_modules at runtime.
 *
 * Usage: DATABASE_URL=... node migrate.mjs
 */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set — cannot run migrations')
  process.exit(1)
}

const client = postgres(url, { max: 1 })
const db = drizzle(client)

const folder = process.env.MIGRATIONS_FOLDER || 'packages/db/migrations'

try {
  await migrate(db, { migrationsFolder: folder })
  console.log('Migrations applied')
  await client.end()
  process.exit(0)
} catch (error) {
  console.error('Migration failed:', error)
  await client.end().catch(() => {})
  process.exit(1)
}
