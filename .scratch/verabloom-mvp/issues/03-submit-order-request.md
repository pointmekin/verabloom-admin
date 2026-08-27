# 03 — Submit a customer order request

**What to build:** A customer can start from a product, choose one variation, provide quantity, contact information, request details, delivery information, and the required date, then submit a pending order request. The success page gives the customer a `VB-` request reference, asks them to capture a screenshot, and shows configured social contacts.

**Phase:** 1 — Public catalog and requests.

**Blocked by:** 02 — Manage and browse the product catalog.

**Status:** ready-for-human

- [x] The product detail page opens a request form with the selected product already identified.
- [x] A request contains one product variation and a positive whole-number quantity that defaults to one.
- [x] The customer provides a required name, LINE, Instagram, or TikTok channel, and a required contact value for that channel.
- [x] Phone number is optional.
- [x] Request details use one plain-text field for bouquet preferences.
- [x] Delivery method choices are postal delivery, messenger delivery, and collection.
- [x] Postal and messenger delivery require an order address; collection does not.
- [x] The required date uses the customer-facing label `ส่งภายในวันที่` in Thai.
- [x] Zod validation runs at the form and server boundary and returns clear field-level errors.
- [x] A hidden honeypot rejects bot-like submissions without CAPTCHA or IP rate limiting.
- [x] Submission controls prevent accidental repeated taps while the request is pending.
- [x] A successful submission creates a pending order request with a unique zero-padded `VB-` request reference.
- [x] The order request snapshots the selected product name, variation name, and displayed starting price while retaining their references.
- [x] Later catalog changes do not alter the selected product details stored on the request.
- [x] The success page shows the request reference, asks the customer to capture a screenshot, and renders only configured social contacts.
- [x] The request reference cannot be used to retrieve private order details publicly.
- [x] The complete form and success experience is translated into Thai and English, with Thai as the default.
- [ ] Browser tests cover the happy path, all conditional delivery rules, invalid quantities, missing contact details, missing required date, honeypot rejection, historical selected product details, and success-page content.
- [x] Type checking, linting, tests, and production build pass.

## Comments

- 2026-08-27: Implemented and committed in `025dc81`. Browser tests remain deferred because `AGENTS.md` explicitly prohibits adding or running Playwright tests in the current verification path.
