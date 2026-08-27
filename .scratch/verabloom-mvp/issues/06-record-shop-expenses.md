# 06 — Record shop expenses

**What to build:** Admins can maintain a simple expense ledger that records what the shop paid for, which team member paid, the total amount and date, and optional quantity and notes.

**Phase:** 2 — Run the shop.

**Blocked by:** 01 — Bilingual application foundation and shared admin access.

**Status:** ready-for-agent

- [ ] An authenticated admin can list expenses newest first.
- [ ] An authenticated admin can add an expense with required description, payer, exact Thai-baht total amount, and expense date.
- [ ] Expense payer choices are limited to Chompooh, Meen, and Kan.
- [ ] Quantity and note are optional and do not force unit-price calculations.
- [ ] An authenticated admin can edit an existing expense.
- [ ] An authenticated admin can delete an expense after a confirmation dialog.
- [ ] Unauthenticated callers cannot read private expense details or invoke expense mutations.
- [ ] Expense forms use shared Zod rules at the form and server boundary and return field-level errors.
- [ ] The expense list uses a table on wider screens and readable stacked records on narrow screens.
- [ ] Browser tests cover listing, adding for each team member, validation, editing, and confirmed deletion.
- [ ] Type checking, linting, tests, and production build pass.
