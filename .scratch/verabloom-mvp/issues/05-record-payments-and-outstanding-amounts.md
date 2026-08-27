# 05 — Record payments and outstanding amounts

**What to build:** Admins can record deposits and later payments against an order, correct payment mistakes, and see received and outstanding amounts on the order. The calculation follows the agreed behavior for partial payments, overpayments, completed work, and cancelled orders.

**Phase:** 2 — Run the shop.

**Blocked by:** 04 — Review requests and manage orders and customers.

**Status:** resolved

- [x] An authenticated admin can add multiple payments to an order.
- [x] Each payment records an exact Thai-baht amount, payment date, bank transfer, cash, or other method, and an optional note.
- [x] The order detail view lists payments and shows total received and outstanding amount.
- [x] Outstanding amount is the greater of zero and order value minus recorded payments.
- [x] Payments exceeding the order value are accepted and never produce a negative outstanding amount.
- [x] A completed order may retain an outstanding amount.
- [x] A cancelled order has zero outstanding amount while its retained payments remain recorded.
- [x] An authenticated admin can edit or delete a payment after a confirmation dialog.
- [x] Unauthenticated callers cannot read private payment details or invoke payment mutations.
- [x] Deterministic calculation tests cover empty payments, deposits, multiple payments, full payment, overpayment, completion with an outstanding amount, and cancellation with a retained payment.
- [ ] Browser tests cover adding, editing, and deleting payments and show the resulting values on the order page at phone and desktop widths.
- [x] Type checking, linting, tests, and production build pass.

## Comments

- 2026-08-27: Implemented the payments workflow: satang-integer money calculations shared by tests and UI (`orderTotals`), a `payments` table with cascade-on-order-delete migration, memory/database store parity, authenticated server functions for listing, adding, editing, and deleting payments, an order-detail payments section with summary values and destructive confirmation dialogs, and Thai/English copy. Browser coverage remains deferred because `AGENTS.md` explicitly prohibits adding or running Playwright tests in the current verification path.
