# Verabloom agent guide

## Product and scope

Verabloom is a Thai-first, mobile-first bouquet shop application with a public
catalog and a shared authenticated admin area. The authoritative MVP brief is
[`spec.md`](.scratch/verabloom-mvp/spec.md); use it to decide product behavior
and keep work within its stated scope. Use the vocabulary in
[`CONTEXT.md`](CONTEXT.md) in code, tests, and technical documentation.

Do not add features that the MVP explicitly excludes, including carts,
multi-product orders, customer accounts, staff roles, online payment flows,
inventory, automated notifications, and accounting/audit subsystems.

## Current project state

The application is initialized and no longer matches the spec's original
"uninitialized" further note. It already has:

- a TanStack Start application with strict TypeScript, Tailwind, and shadcn/ui
  conventions;
- Thai/English interface infrastructure, with Thai as the default and a
  persisted language choice;
- shared admin authentication and server-side session handling;
- the first catalog slice: products, variations, ordered images, public catalog
  routes, protected catalog management routes, storage operations, Drizzle
  schema/migrations, and unit tests; and
- uncommitted work in the tree. Preserve and build on it; do not discard or
  rewrite unrelated changes.

Orders, customers, payments, expenses, dashboard totals, reporting, and their
related admin workflows are not yet implemented. Treat the catalog's existing
patterns as the starting point, while correcting them only when a concrete MVP
requirement demands it.

## Implementation constraints

- Use TanStack Start, strict TypeScript, Zod at form and server-mutation
  boundaries, Drizzle with Neon PostgreSQL, and server-side authentication.
- Use **shadcn/ui components** for UI work: controls, dialogs, navigation,
  cards, tables or responsive record cards, summary cards, and charts. Reuse
  the components in `src/components/ui/` and add shadcn-compatible components
  when needed; do not introduce a competing component library.
- Keep the UI mobile-first. Dense desktop tables must have a readable narrow
  screen presentation rather than requiring horizontal scanning.
- Follow the `hiu-app` visual and technical precedent only where it fits this
  MVP. Do not copy unrelated architecture or features.
- Translate application-owned interface copy in both Thai and English. Do not
  translate admin-authored product names, variation names, descriptions, or
  customer-entered request details. Thai remains the default.
- Store money as exact decimal or minor units; never use JavaScript floating
  point arithmetic for Thai baht calculations. Business dates that have no
  time meaning stay as dates; financial month boundaries use Bangkok time.
- Public routes must remain public. Every admin page loader and every admin
  mutation must independently enforce authentication; hiding UI is not access
  control.
- Keep product/variation snapshots on orders, retain catalog records referenced
  by historical orders, and hide discontinued products instead of deleting
  them. Preserve per-order addresses independently from a customer's default
  address.
- Keep changes small and direct. Do not introduce client-state libraries,
  generalized idempotency systems, or abstraction layers without a demonstrated
  requirement.

## Testing and verification

- Write and maintain focused Vitest unit tests for deterministic domain logic,
  validation, date boundaries, storage boundaries, and server behavior where
  it gives clearer diagnostics.
- **Do not add, run, update, or require Playwright/browser tests for now.**
  Existing `tests/e2e/` and `npm run test:e2e` are intentionally out of the
  active verification path until this instruction changes.
- For ordinary changes, run the relevant subset of:

  ```bash
  npm run typecheck
  npm run lint
  npm test
  npm run build
  ```

- Never point `DATABASE_URL_TEST` at production. Tests requiring persistence
  must use isolated test data or controlled fakes; storage tests must not use
  the real S3 bucket.

## Working conventions

- Inspect the relevant code and state explicit scope and acceptance criteria
  before a substantive change. Make surgical edits only; do not clean up
  unrelated code.
- Use the agent issue tracker for scoped work: issues live under
  `.scratch/<feature-slug>/`. Follow
  [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md) and the labels
  in [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).
- Keep domain decisions in the root `CONTEXT.md`. No ADR is required for the
  MVP decisions already recorded in the specification unless a new,
  consequential decision needs one.
- Never expose credentials, S3 configuration, session secrets, or private order
  information in public routes. Request references are identifiers, not
  authorization tokens.
