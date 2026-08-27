# 04 — Review requests and manage orders and customers

**What to build:** Admins can find pending requests, connect them to customer records, correct the details agreed through social conversation, set the final order value, and move work through its simple lifecycle. Admins can also create orders received outside the public form and maintain reusable customer information and order history.

**Phase:** 2 — Run the shop.

**Blocked by:** 03 — Submit a customer order request.

**Status:** ready-for-agent

- [ ] The admin navigation and dashboard shell show the current pending-request count.
- [ ] The orders page lists newest records first and searches by request reference, customer name, social contact, and phone.
- [ ] The orders page filters by pending review, confirmed, completed, and cancelled status.
- [ ] An order detail view shows customer details, selected product details, request details, delivery information, required date, status, order value, and internal note.
- [ ] An admin can edit submitted request details after discussing them with the customer.
- [ ] An admin can select an existing customer or create a customer inline while reviewing a request.
- [ ] Public requests are not matched to customers automatically.
- [ ] A customer contains required name, social channel and contact, optional phone, and optional default address.
- [ ] The customer detail page shows the customer's order history.
- [ ] A customer with orders cannot be deleted in a way that breaks history.
- [ ] Confirming a request requires a final order value in Thai baht.
- [ ] An admin can change an order between the agreed pending, confirmed, completed, and cancelled states.
- [ ] An admin can complete an order regardless of whether money remains outstanding.
- [ ] An admin can add or edit a private internal note that never appears on public pages.
- [ ] An admin can create an order directly, choose an existing or inline-created customer, and save it as pending or confirmed.
- [ ] A new delivery order can copy a customer's default address into an independently editable order address.
- [ ] Changing the customer's default address never changes an existing order address.
- [ ] Incorrect orders can be edited or deleted after a confirmation dialog.
- [ ] Admin lists and details use tables on wider screens and readable stacked layouts on narrow screens.
- [ ] Browser tests cover public-request review, inline customer creation, existing-customer linking, direct order creation, default-address copying, historical address behavior, search, filtering, status changes, internal notes, and confirmed deletion.
- [ ] Type checking, linting, tests, and production build pass.
