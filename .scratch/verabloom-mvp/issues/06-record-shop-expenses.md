# 06 — Record shop expenses

**What to build:** Admins can maintain a simple expense ledger that records what the shop paid for, which team member paid, the total amount and date, and optional quantity and notes.

**Phase:** 2 — Run the shop.

**Blocked by:** 01 — Bilingual application foundation and shared admin access.

**Status:** resolved

- [x] An authenticated admin can list expenses newest first.
- [x] An authenticated admin can add an expense with required description, payer, exact Thai-baht total amount, and expense date.
- [x] Expense payer choices are limited to Chompooh, Meen, and Kan.
- [x] Quantity and note are optional and do not force unit-price calculations.
- [x] An authenticated admin can edit an existing expense.
- [x] An authenticated admin can delete an expense after a confirmation dialog.
- [x] Unauthenticated callers cannot read private expense details or invoke expense mutations.
- [x] Expense forms use shared Zod rules at the form and server boundary and return field-level errors.
- [x] The expense list uses a table on wider screens and readable stacked records on narrow screens.
- [ ] Browser tests cover listing, adding for each team member, validation, editing, and confirmed deletion.
- [x] Type checking, linting, tests, and production build pass.

## Comments

- 2026-08-27: Implemented the expense ledger following the payments pattern: an `expenses` table (`0005` migration) with description, payer (`chompooh`/`meen`/`kan`), exact numeric(12,2) total, date, nullable quantity, and nullable note; a memory/database `expense-store.server.ts` listing newest first (date desc, then id desc) with store-level Vitest coverage in memory mode (CRUD, validation, ordering, and the memory fallback shared with the other stores); shared `expenseInputSchema` in `admin-expense.ts` reused by the form (`safeParse` for field-level errors) and the server-function validator, with every list/mutation server function independently asserting an admin session; an `/admin/expenses` page reusing the responsive orders table (stacked records on narrow screens), add/edit dialog, and destructive confirmation dialog; Thai/English copy and header/overview navigation. Quantity and note stay informational with no unit-price math. Browser coverage remains deferred because `AGENTS.md` explicitly prohibits adding or running Playwright tests in the current verification path.
