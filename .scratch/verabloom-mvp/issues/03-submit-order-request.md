# 03 — Submit a customer order request

**What to build:** A customer can start from a product, choose one variation, provide quantity, contact information, request details, delivery information, and the required date, then submit a pending order request. The success page gives the customer a `VB-` request reference, asks them to capture a screenshot, and shows configured social contacts.

**Phase:** 1 — Public catalog and requests.

**Blocked by:** 02 — Manage and browse the product catalog.

**Status:** ready-for-agent

- [ ] The product detail page opens a request form with the selected product already identified.
- [ ] A request contains one product variation and a positive whole-number quantity that defaults to one.
- [ ] The customer provides a required name, LINE, Instagram, or TikTok channel, and a required contact value for that channel.
- [ ] Phone number is optional.
- [ ] Request details use one plain-text field for bouquet preferences.
- [ ] Delivery method choices are postal delivery, messenger delivery, and collection.
- [ ] Postal and messenger delivery require an order address; collection does not.
- [ ] The required date uses the customer-facing label `ส่งภายในวันที่` in Thai.
- [ ] Zod validation runs at the form and server boundary and returns clear field-level errors.
- [ ] A hidden honeypot rejects bot-like submissions without CAPTCHA or IP rate limiting.
- [ ] Submission controls prevent accidental repeated taps while the request is pending.
- [ ] A successful submission creates a pending order request with a unique zero-padded `VB-` request reference.
- [ ] The order request snapshots the selected product name, variation name, and displayed starting price while retaining their references.
- [ ] Later catalog changes do not alter the selected product details stored on the request.
- [ ] The success page shows the request reference, asks the customer to capture a screenshot, and renders only configured social contacts.
- [ ] The request reference cannot be used to retrieve private order details publicly.
- [ ] The complete form and success experience is translated into Thai and English, with Thai as the default.
- [ ] Browser tests cover the happy path, all conditional delivery rules, invalid quantities, missing contact details, missing required date, honeypot rejection, historical selected product details, and success-page content.
- [ ] Type checking, linting, tests, and production build pass.
