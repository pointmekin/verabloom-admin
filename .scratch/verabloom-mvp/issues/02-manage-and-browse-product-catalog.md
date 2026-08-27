# 02 — Manage and browse the product catalog

**What to build:** Admins can create and maintain products, their applicable variations, starting prices, Markdown descriptions, visibility, display order, and ordered S3 images. Customers can browse visible products, filter by variation, and inspect a product's images, description, variations, and indicative prices.

**Phase:** 1 — Public catalog and requests.

**Blocked by:** 01 — Bilingual application foundation and shared admin access.

**Status:** ready-for-agent

- [x] An authenticated admin can create and edit a product with a name and Markdown description.
- [x] An authenticated admin can add, edit, reorder, and remove the variations belonging to a product.
- [x] Each variation has a name and optional starting price in Thai baht.
- [x] Product Markdown renders a sanitized subset containing paragraphs, line breaks, bullet lists, emphasis, and links.
- [x] The admin editor includes concise Markdown guidance and a preview.
- [x] Authenticated image uploads use the configured S3 bucket and dedicated `verabloom/` key prefix.
- [x] An admin can upload multiple product images, reorder them, and use the first image as the catalog cover.
- [x] Image records store object keys and display through stable public URLs.
- [x] Unauthenticated users cannot invoke catalog mutations or image uploads.
- [x] An admin can reorder products and hide a product without deleting it.
- [x] The public catalog shows only visible products in the configured order.
- [x] Customers can filter the catalog by variation and clear the filter.
- [x] A public product page shows all ordered images, formatted description, applicable variations, and prices labelled as starting prices.
- [x] Product content remains exactly as entered when the interface language changes.
- [x] Catalog and product pages work on phone and desktop widths.
- [x] Browser tests cover the complete admin-to-public workflow, including create, edit, reorder, hide, filter, and product detail behavior.
- [x] Storage-boundary tests use a controlled fake rather than the real S3 bucket.
- [x] Type checking, linting, tests, and production build pass.
