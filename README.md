# Verabloom admin

Thai-first public and shared-admin application built with TanStack Start, strict TypeScript, Tailwind CSS, shadcn/ui conventions, Drizzle, and Neon PostgreSQL.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a random `SESSION_SECRET` of at least 32 characters before testing admin access. `DATABASE_URL` is not required to render the foundation routes, but database commands require it.

## Database workflow

The TypeScript schema in `src/db/schema.ts` is the source of truth. Feature tickets add their domain tables there.

```bash
npm run db:generate
npm run db:migrate
```

Automated database workflows use a separate Neon branch or PostgreSQL database. Set `DATABASE_URL_TEST`, then run:

```bash
npm run db:migrate:test
```

Never point `DATABASE_URL_TEST` at production. Each browser workflow should create and clean up its own fixtures as domain tables are introduced.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

The production build uses Nitro's Vercel preset. Configure the variables from `.env.example` in the Vercel project before deployment.
