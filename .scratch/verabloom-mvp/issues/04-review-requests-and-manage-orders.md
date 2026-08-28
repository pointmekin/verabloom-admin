# 04 — Review requests and manage orders and customers

**What to build:** Admins can find pending requests, connect them to customer records, correct the details agreed through social conversation, set the final order value, and move work through its simple lifecycle. Admins can also create orders received outside the public form and maintain reusable customer information and order history.

**Phase:** 2 — Run the shop.

**Blocked by:** 03 — Submit a customer order request.

**Status:** resolved

- [x] The admin navigation and dashboard shell show the current pending-request count.
- [x] The orders page lists newest records first and searches by request reference, customer name, social contact, and phone.
- [x] The orders page filters by pending review, confirmed, completed, and cancelled status.
- [x] An order detail view shows customer details, selected product details, request details, delivery information, required date, status, order value, and internal note.
- [x] An admin can edit submitted request details after discussing them with the customer.
- [x] An admin can select an existing customer or create a customer inline while reviewing a request.
- [x] Public requests are not matched to customers automatically.
- [x] A customer contains required name, social channel and contact, optional phone, and optional default address.
- [x] The customer detail page shows the customer's order history.
- [x] A customer with orders cannot be deleted in a way that breaks history.
- [x] Confirming a request requires a final order value in Thai baht.
- [x] An admin can change an order between the agreed pending, confirmed, completed, and cancelled states.
- [x] An admin can complete an order regardless of whether money remains outstanding.
- [x] An admin can add or edit a private internal note that never appears on public pages.
- [x] An admin can create an order directly, choose an existing or inline-created customer, and save it as pending or confirmed.
- [x] A new delivery order can copy a customer's default address into an independently editable order address.
- [x] Changing the customer's default address never changes an existing order address.
- [x] Incorrect orders can be edited or deleted after a confirmation dialog.
- [x] Admin lists and details use tables on wider screens and readable stacked layouts on narrow screens.
- [ ] Browser tests cover public-request review, inline customer creation, existing-customer linking, direct order creation, default-address copying, historical address behavior, search, filtering, status changes, internal notes, and confirmed deletion.
- [x] Type checking, linting, tests, and production build pass.

## Comments

- 2026-08-27: Implemented the authenticated orders and customers workflow, including search/filtering, lifecycle edits, customer linking/creation, address snapshots, exact-value confirmation validation, mobile-friendly lists, and destructive confirmation dialogs. Browser coverage remains deferred because `AGENTS.md` explicitly prohibits adding or running Playwright tests in the current verification path. Payment records remain scoped to issue 05.
- 2026-08-28: Polished the orders list after a focused UX critique. The list now has a pending shortcut, visible active-filter recovery, differentiated no-match state, localized required dates, clear missing-value copy, and a compact mobile triage order that links from a larger request-reference target.
