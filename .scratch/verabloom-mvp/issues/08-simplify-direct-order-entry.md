# Simplify direct order entry

Type: task
Status: resolved

## Requirement

Replace the catalog and customer setup flow with one direct order form.

The form must contain only these business fields:

- LINE name
- Flower type and size
- Details
- Messenger or postal delivery
- Required date
- Delivery address, optional
- Phone, optional
- Price

Remove the customer creation flow. Remove catalog creation and catalog pages. Keep the existing finance workflow.

## Acceptance

- An admin can create and edit an order without a product or saved customer.
- The form does not require an address or phone.
- The form does not offer collection as a delivery method.
- Admin navigation has no catalog or customer link.
- Catalog and customer pages are not routes.
- Existing finance behavior remains available.

## Comments

- Implemented the direct order form and removed catalog and customer routes.
- Added migration `0007_heavy_colonel_america.sql` for nullable order product references.
- Verified mobile form creation without an address or phone, then removed the verification record.
- Verified `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
