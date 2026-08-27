import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: ['.env.local', '.env'] })

const databaseUrl =
  process.env.VERABLOOM_DATABASE_ENV === 'test'
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    process.env.VERABLOOM_DATABASE_ENV === 'test'
      ? 'DATABASE_URL_TEST is required for test migrations'
      : 'DATABASE_URL is required for migrations',
  )
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
})
