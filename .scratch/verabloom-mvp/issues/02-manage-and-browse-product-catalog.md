# 02 — Manage and browse the product catalog

**What to build:** Admins can create and maintain products, their applicable variations, starting prices, Markdown descriptions, visibility, display order, and ordered S3 images. Customers can browse visible products, filter by variation, and inspect a product's images, description, variations, and indicative prices.

**Phase:** 1 — Public catalog and requests.

**Blocked by:** 01 — Bilingual application foundation and shared admin access.

**Status:** ready-for-agent

- [ ] An authenticated admin can create and edit a product with a name and Markdown description.
- [ ] An authenticated admin can add, edit, reorder, and remove the variations belonging to a product.
- [ ] Each variation has a name and optional starting price in Thai baht.
- [ ] Product Markdown renders a sanitized subset containing paragraphs, line breaks, bullet lists, emphasis, and links.
- [ ] The admin editor includes concise Markdown guidance and a preview.
- [ ] Authenticated image uploads use the configured S3 bucket and dedicated `verabloom/` key prefix.
- [ ] An admin can upload multiple product images, reorder them, and use the first image as the catalog cover.
- [ ] Image records store object keys and display through stable public URLs.
- [ ] Unauthenticated users cannot invoke catalog mutations or image uploads.
- [ ] An admin can reorder products and hide a product without deleting it.
- [ ] The public catalog shows only visible products in the configured order.
- [ ] Customers can filter the catalog by variation and clear the filter.
- [ ] A public product page shows all ordered images, formatted description, applicable variations, and prices labelled as starting prices.
- [ ] Product content remains exactly as entered when the interface language changes.
- [ ] Catalog and product pages work on phone and desktop widths.
- [ ] Browser tests cover the complete admin-to-public workflow, including create, edit, reorder, hide, filter, and product detail behavior.
- [ ] Storage-boundary tests use a controlled fake rather than the real S3 bucket.
- [ ] Type checking, linting, tests, and production build pass.
