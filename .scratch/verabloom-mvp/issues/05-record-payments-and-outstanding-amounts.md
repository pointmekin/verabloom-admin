# 05 — Record payments and outstanding amounts

**What to build:** Admins can record deposits and later payments against an order, correct payment mistakes, and see received and outstanding amounts on the order. The calculation follows the agreed behavior for partial payments, overpayments, completed work, and cancelled orders.

**Phase:** 2 — Run the shop.

**Blocked by:** 04 — Review requests and manage orders and customers.

**Status:** ready-for-agent

- [ ] An authenticated admin can add multiple payments to an order.
- [ ] Each payment records an exact Thai-baht amount, payment date, bank transfer, cash, or other method, and an optional note.
- [ ] The order detail view lists payments and shows total received and outstanding amount.
- [ ] Outstanding amount is the greater of zero and order value minus recorded payments.
- [ ] Payments exceeding the order value are accepted and never produce a negative outstanding amount.
- [ ] A completed order may retain an outstanding amount.
- [ ] A cancelled order has zero outstanding amount while its retained payments remain recorded.
- [ ] An authenticated admin can edit or delete a payment after a confirmation dialog.
- [ ] Unauthenticated callers cannot read private payment details or invoke payment mutations.
- [ ] Deterministic calculation tests cover empty payments, deposits, multiple payments, full payment, overpayment, completion with an outstanding amount, and cancellation with a retained payment.
- [ ] Browser tests cover adding, editing, and deleting payments and show the resulting values on the order page at phone and desktop widths.
- [ ] Type checking, linting, tests, and production build pass.
