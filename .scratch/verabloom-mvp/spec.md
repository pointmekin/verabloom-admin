# Verabloom shop management MVP

Status: ready-for-agent

## Problem Statement

Verabloom currently coordinates bouquet requests, customer details, payments, and material expenses without one shared system. Customers need a clear mobile catalog and a structured way to send bouquet requirements. The shop needs to turn those requests into confirmed orders, record partial or complete payments, record which team member paid each expense, and understand the cash position without adopting a full ecommerce or accounting platform.

## Solution

Build a Thai-first, mobile-first web application with a public bouquet catalog and a shared authenticated admin area. Customers browse products and variations, submit an order request, and receive a request reference they can screenshot and use when contacting the shop. Admins manage the catalog, review and confirm requests, create orders received through social channels, maintain customers, record payments and expenses, and view financial summaries and a simple six-month chart.

The application deliberately stays small. An order contains one product variation and a quantity. The shop agrees the final order value outside the system and records it when confirming the order. Customer payments remain separate records so deposits, later installments, received income, and outstanding amounts remain visible.

## User Stories

1. As a customer, I want to browse visible bouquet products on my phone, so that I can see what Verabloom offers.
2. As a customer, I want products displayed in the order chosen by the shop, so that featured designs appear first.
3. As a customer, I want to filter products by variation, so that I can narrow the catalog to a suitable size or construction style.
4. As a customer, I want to clear the variation filter, so that I can return to the complete catalog.
5. As a customer, I want to open a product from its catalog card, so that I can inspect its details before requesting it.
6. As a customer, I want to see multiple product images, so that I can understand the bouquet from more than one view.
7. As a customer, I want to see formatted paragraphs, bullet lists, emphasis, and links in a product description, so that the details are easy to read.
8. As a customer, I want to see only the variations offered for a product, so that I am not presented with invalid choices.
9. As a customer, I want to see each variation's starting price, so that I have a useful price indication before contacting the shop.
10. As a customer, I want starting prices clearly labelled as indicative, so that I do not mistake them for an agreed final price.
11. As a customer, I want to begin a request from the selected product page, so that the request already identifies the bouquet I chose.
12. As a customer, I want to choose one product variation and enter a quantity, so that the shop knows the basic shape of my request.
13. As a customer, I want quantity to default to one and accept positive whole numbers, so that common orders require little input.
14. As a customer, I want a plain-text field for colors, flowers, wrapping, card text, and other preferences, so that I can explain custom requirements without navigating a long questionnaire.
15. As a customer, I want to enter my name, preferred social channel, and channel contact, so that the shop can follow up with me.
16. As a customer, I want to provide an optional phone number, so that the shop has another contact method when needed.
17. As a customer, I want to choose postal delivery, messenger delivery, or collection, so that the shop knows how I intend to receive the order.
18. As a customer, I want an address to be required for postal and messenger delivery but not collection, so that the form requests only relevant information.
19. As a customer, I want to enter a required date labelled "ส่งภายในวันที่", so that the shop knows when the order must be ready or dispatched.
20. As a customer, I want the application to reject invalid or incomplete submissions with clear field errors, so that I can correct them.
21. As a customer, I want the order request form to submit only once when I tap the button, so that accidental repeated taps do not create duplicates.
22. As a customer, I want a success page after submission, so that I know Verabloom received my request.
23. As a customer, I want a human-readable `VB-` request reference, so that I can identify the request in later conversations.
24. As a customer, I want the success page to ask me to screenshot it as evidence, so that I retain the submitted reference.
25. As a customer, I want the success page to show configured LINE, Instagram, and TikTok contacts, so that I can continue the conversation or send reference images.
26. As a customer, I want to switch the interface between Thai and English, so that I can use the navigation and forms in my preferred language.
27. As a customer, I want Thai to be selected by default, so that the application matches Verabloom's primary audience.
28. As a customer, I want catalog content shown exactly as the shop entered it, so that missing translations do not hide or alter product information.
29. As an admin, I want to sign in using the shared configured credentials, so that the management area is not public.
30. As an admin, I want my authenticated session to persist across browser restarts, so that I do not need to sign in repeatedly.
31. As an admin, I want to log out, so that I can end the shared session on a device.
32. As an admin, I want public routes to remain accessible without signing in, so that authentication does not obstruct the catalog.
33. As an admin, I want protected routes and mutations to reject unauthenticated access, so that changing a URL or calling an endpoint cannot bypass login.
34. As an admin, I want to see the number of pending requests in the admin navigation and dashboard, so that I notice new work without external notifications.
35. As an admin, I want to list orders newest first, so that recent requests are easy to find.
36. As an admin, I want to search orders by customer name, contact detail, or request reference, so that I can retrieve an order during a conversation.
37. As an admin, I want to filter orders by status, so that I can focus on pending, confirmed, completed, or cancelled work.
38. As an admin, I want to open an order and see its customer, selected product details, request details, delivery information, required date, payments, and internal note, so that I have the full working record.
39. As an admin, I want submitted product and variation details to remain unchanged after later catalog edits, so that an old request still reflects what the customer selected.
40. As an admin, I want to edit all submitted request details after speaking with the customer, so that the record matches the agreement.
41. As an admin, I want to enter the final order value when confirming a request, so that starting price and agreed price remain distinct.
42. As an admin, I want to move an order through pending review, confirmed, completed, and cancelled states, so that I can track its simple lifecycle.
43. As an admin, I want to complete an order with an outstanding amount, so that the system records reality without enforcing a payment policy.
44. As an admin, I want a cancelled order to have no outstanding amount, so that it does not appear as money still owed.
45. As an admin, I want retained payments on a cancelled order to remain in received income, so that the cash total reflects money the shop kept.
46. As an admin, I want to create an order directly from the admin area, so that requests received through social channels enter the same workflow.
47. As an admin, I want a directly created order to begin as pending or confirmed, so that I can match how much has already been agreed.
48. As an admin, I want to select an existing customer while creating or reviewing an order, so that repeat business shares one customer record.
49. As an admin, I want to create a customer inline while creating an order, so that order entry does not require a separate setup flow.
50. As an admin, I want to link a public request to an existing customer during review, so that public submissions do not require unreliable automatic matching.
51. As an admin, I want to add an internal note to an order, so that shop-only context does not appear to the customer.
52. As an admin, I want to edit or delete an incorrect order with confirmation, so that mistakes can be corrected without an audit subsystem.
53. As an admin, I want to create and edit customers with name, channel, channel contact, optional phone, and optional default address, so that customer information remains reusable.
54. As an admin, I want to search and select customers by their identifying details, so that similar names do not force automatic matching.
55. As an admin, I want a customer's order history on the customer detail page, so that I can understand prior purchases.
56. As an admin, I want a customer's default address copied into a new delivery order, so that repeat entry is faster.
57. As an admin, I want each delivery order to retain its own address, so that editing a customer's default address does not rewrite history.
58. As an admin, I want customers with orders to be retained, so that financial and order records do not lose their owner.
59. As an admin, I want to create and edit products with descriptions and visibility, so that I can maintain the public catalog.
60. As an admin, I want to create only the variations that apply to each product, so that products are not forced into a universal size list.
61. As an admin, I want to enter a variation name and optional starting price, so that each purchasable option can be represented accurately.
62. As an admin, I want a concise Markdown guide and preview while editing descriptions, so that I can use supported formatting without a large editor.
63. As an admin, I want to upload multiple product images and control their order, so that the first image acts as the cover and the remaining images form the gallery.
64. As an admin, I want to reorder products, so that I control the catalog sequence.
65. As an admin, I want to hide a product without breaking past orders, so that discontinued products disappear publicly while history remains intact.
66. As an admin, I want products referenced by orders to be retained, so that deleting catalog data cannot damage order history.
67. As an admin, I want to record multiple payments against an order, so that deposits and later installments remain separate.
68. As an admin, I want each payment to include amount, date, method, and an optional note, so that received income can be explained.
69. As an admin, I want bank transfer, cash, and other as payment methods, so that common payments are quick to classify.
70. As an admin, I want to edit or delete an incorrect payment with confirmation, so that mistakes do not require adjustment entries.
71. As an admin, I want overpayments accepted and outstanding amount floored at zero, so that the application does not impose extra correction rules.
72. As an admin, I want to record an expense with description, payer, total amount, date, optional quantity, and optional note, so that the shop can see who paid for what.
73. As an admin, I want to choose Chompooh, Meen, or Kan as the expense payer, so that the recorded payer remains consistent.
74. As an admin, I want to edit or delete an incorrect expense with confirmation, so that simple corrections remain possible.
75. As an admin, I want all-time received income, expenses, net cash, and outstanding amount cards, so that I can see the current position immediately.
76. As an admin, I want net cash calculated as received income minus expenses, so that promised but unpaid order value is not treated as cash.
77. As an admin, I want outstanding amount calculated from non-cancelled order values and payments, so that I can see what customers still owe.
78. As an admin, I want a chart of received income and expenses by month for the latest six months, so that I can see their recent direction.
79. As an admin, I want a payments table showing customer, order reference, amount, date, and method, so that received income remains traceable.
80. As an admin, I want each payment row to link to its order, so that I can inspect the source transaction.
81. As an admin, I want an expenses table showing description, payer, amount, date, and quantity, so that shop spending remains traceable.
82. As an admin, I want to choose an inclusive reporting period, so that I can review finances for a specific span.
83. As an admin, I want received income, expenses, and net cash recalculated for the reporting period, so that the report answers the same questions as the dashboard for selected dates.
84. As an admin, I want the report to show matching payment and expense rows, so that I can verify its totals.
85. As an admin using a phone, I want dense tables to become readable stacked cards, so that the management area remains usable away from a laptop.
86. As an admin using a desktop, I want the same workflows presented in a wider layout, so that routine data entry remains efficient.

## Implementation Decisions

- Build one TanStack Start application with public catalog routes and authenticated admin routes. Deploy it as a serverless application on Vercel.
- Use strict TypeScript throughout. Use Zod schemas at every form and server-mutation boundary. Return field-level validation errors without duplicating validation rules in unrelated modules.
- Use Neon PostgreSQL with Drizzle for persistence and migrations.
- Keep the domain in one application context. Use the vocabulary in the root domain glossary in code, tests, and UI-facing technical documentation.
- Use Shadcn/ui for form controls, dialogs, responsive navigation, tables or cards, summary cards, and charts. Match the typography and visual tone of `hiu-app` without copying its feature breadth or architecture blindly.
- Use `i18next` with `react-i18next`, following the working precedent in `hiu-app`. Provide complete Thai and English interface resource files, default to Thai, and persist the visitor's language choice. Do not translate admin-authored product content.
- Do not add Zustand initially. Add client state only when component or URL state cannot express a demonstrated need.
- Model products separately from variations and ordered product images. A product owns its applicable variations and ordered images. The first image is the catalog cover.
- Give products a visibility state and explicit display position. Hidden products and their details are unavailable on public routes but remain available to authenticated admins and historical orders.
- Store product descriptions as Markdown. Sanitize rendered output and support only paragraphs, line breaks, bullet lists, emphasis, and links. The admin editor provides concise syntax guidance and a preview rather than a full rich-text editor.
- Upload product images through authenticated server operations to the existing S3 bucket under a dedicated `verabloom/` prefix. Store ordered object keys in the database. Construct stable public image URLs from configuration rather than storing bucket credentials or full configuration per image.
- Model a customer with name, social channel, channel contact, optional phone, and optional default address. Social channel values are LINE, Instagram, and TikTok.
- Model an order request and accepted order in one order record with a lifecycle status. Status values correspond to pending review, confirmed, completed, and cancelled.
- Generate a unique human-readable request reference using the `VB-` prefix and a zero-padded numeric sequence. Do not use it as authorization.
- Each order references one product and one variation and records a positive whole-number quantity. Different products require separate orders.
- Snapshot the selected product name, variation name, and displayed starting price into the order at creation. Retain the product and variation references as well.
- Store request details as plain text and the internal note as a separate optional admin-only field.
- Store the required date as a date without a time. Show its customer-facing label as "ส่งภายในวันที่".
- Delivery method values are postal delivery, messenger delivery, and collection. Postal and messenger orders require an order address. Collection orders do not.
- Copy a selected customer's default address into a newly created delivery order as an editable starting value. Never derive a historical order address dynamically from the current customer record.
- Allow public submissions to create pending order requests without automatically matching a customer. During review, an admin may link the request to an existing customer or create a new customer.
- Allow authenticated admins to create an order directly and choose pending or confirmed as its initial state. A confirmed order requires an order value.
- Record the order value in Thai baht using an exact decimal or integer minor-unit representation. Do not use floating-point arithmetic for money.
- Store payments separately from orders. Each payment has an order, amount, payment date, method, and optional note. Payment methods are bank transfer, cash, and other.
- Permit payments whose sum exceeds the order value. Calculate outstanding amount as the greater of zero and order value minus recorded payments.
- A cancelled order has zero outstanding amount. Its retained payments continue to count as received income.
- Store expenses separately with description, payer, total amount, expense date, optional quantity, and optional note. Payer values are the fixed team members Chompooh, Meen, and Kan.
- Define received income as the sum of recorded payments. Define net cash as received income minus recorded expenses. Define outstanding amount across non-cancelled orders only.
- Use all-time totals for the main dashboard. Aggregate received income and expenses by calendar month in the Bangkok timezone for the latest six months.
- Treat reporting-period start and end dates as inclusive. Filter payments by payment date and expenses by expense date before calculating report totals.
- Use Thai baht only. Store business dates without time-of-day where time does not affect meaning. Interpret month boundaries in the Bangkok timezone.
- Search orders by request reference, customer name, social contact, and optional phone. Filter orders by status and order them newest first.
- Keep initial listing behavior simple. Do not expose table customization, saved views, or bulk actions. Add server-side pagination only when data volume makes it necessary.
- Configure LINE, Instagram, and TikTok destination URLs through environment variables. Render only configured links.
- The public success route displays the request reference and configured social contacts and asks the customer to capture a screenshot. It does not provide order lookup or reveal private order data from a reference.
- Protect the public form with server-side Zod validation and a hidden honeypot. Do not add CAPTCHA or IP rate limiting.
- Authenticate the admin area against one username and password supplied through environment variables. Compare credentials only on the server.
- Create a signed, HTTP-only, secure session cookie after successful login. Set an explicit persistence period, use suitable same-site protection, and provide logout that invalidates the session.
- Require authentication independently on every admin page loader and server mutation. Hiding admin UI is not an authorization control.
- Do not model admin users, roles, permissions, password reset, or audit history. The expense payer is a business value and is unrelated to the shared login.
- Allow direct edits and confirmed deletion of standalone payments and expenses. Allow order deletion with confirmation when correction is required. Retain products and customers that historical orders reference; hide products instead of deleting them.
- Build mobile-first public and admin layouts. Use table layouts on wider screens and readable stacked records on narrow screens where tables would require horizontal scanning.
- Keep submission buttons disabled while their mutation is pending and make server handling resilient to accidental duplicate client submission where practical. Do not add a general idempotency framework.

## Testing Decisions

- The primary test seam is the running application through its public and authenticated browser workflows. Tests should assert visible behavior, persisted outcomes, authorization boundaries, and financial results rather than component structure, hook calls, SQL text, or CSS implementation.
- Cover the public happy path end to end: browse and filter the catalog, open a product, choose a variation, submit a valid delivery request, and see the generated request reference, screenshot instruction, and configured contacts.
- Cover public validation behavior at the browser seam: missing contact data, non-positive or fractional quantity, missing delivery address when required, collection without an address, missing required date, and honeypot submission.
- Cover the Thai default and Thai-to-English interface switch. Assert translated interface text while confirming that admin-authored catalog content remains unchanged.
- Cover authentication end to end: failed login, successful login, persistent session, logout, redirect from protected pages, and direct unauthenticated mutation rejection.
- Cover the admin order workflow end to end: locate a pending request, link or create a customer, edit details, set an order value, confirm it, record partial payments, complete it while outstanding, and find it through search and status filters.
- Cover direct admin order creation with inline customer creation and optional use of a customer's default address.
- Cover catalog management end to end: create a product and its variations, upload and reorder images, render supported Markdown, reorder products, hide a product, and confirm that its historical selected product details remain visible on an existing order.
- Cover payment and expense entry, editing, and confirmed deletion through the finance interface.
- Cover dashboard and reporting behavior with known dated fixtures: received income, expenses, net cash, outstanding amount, cancelled-order handling, six-month monthly aggregates, and inclusive reporting-period boundaries.
- Add focused deterministic tests for financial calculations and order-state-derived values. These tests should exercise public calculation functions with domain-shaped inputs, including partial payments, overpayment, cancelled orders with retained payments, completed orders with outstanding amounts, and empty datasets.
- Add focused tests for business-date boundaries in the Bangkok timezone where a browser test would make a failure difficult to diagnose.
- Test authenticated S3 upload behavior at the server boundary with the storage client replaced by a controlled fake. Assert accepted image metadata, the dedicated key prefix, ordered persistence, and rejection of unauthenticated uploads. Do not make the test suite depend on the real bucket.
- Use test database isolation for browser workflows so each test controls its products, customers, orders, payments, and expenses. Avoid tests that depend on execution order.
- The repository has no existing application tests or prior test conventions. Establish the browser seam first and keep lower-level tests limited to money, date, and storage behavior that benefits from direct diagnostics.

## Out of Scope

- Inventory, stock counts, material consumption, and purchasing workflows
- Customer accounts, customer authentication, and public order lookup
- Separate staff accounts, roles, permissions, password recovery, and login auditing
- Online payments, payment-provider integrations, bank reconciliation, and receipt uploads
- Refund accounting and adjustment-entry workflows
- Delivery-provider integrations, tracking, time slots, and automatic delivery-fee calculation
- Automated email, LINE, Instagram, TikTok, or push notifications
- Customer image and file uploads
- Discounts, coupons, promotions, tax invoices, and checkout calculations
- Multi-product orders and shopping carts
- Expense categories, suppliers, recurring expenses, reimbursements, and receipt uploads
- Production, packing, shipping, and delivery sub-statuses
- Customer-data retention automation and dedicated privacy-consent workflows
- Audit history, soft-delete restoration, trash, and record versioning
- Automatic translation of product names, variation names, and descriptions
- Configurable dashboards, chart selectors, drill-down analytics, and saved report configurations
- CSV, spreadsheet, and PDF exports
- A separate reports module or scheduled reports
- Native mobile applications and installable PWA behavior
- CAPTCHA and IP-based rate limiting
- A general media library, image cropper, or image editor

## Further Notes

- The application repository is currently uninitialized apart from agent guidance and the domain glossary. The implementation should fit the TanStack Start scaffold the user will initialize rather than inventing abstractions before that structure exists.
- `hiu-app` is a visual and technical reference for typography, theme, i18n precedent, strict TypeScript, TanStack Start, Drizzle, Neon, Shadcn/ui, and S3 usage. Verabloom should not inherit unrelated authentication, import, inventory, or architectural complexity.
- Thai is the default interface language. English translations cover application-owned interface copy only.
- Product descriptions and request details may contain either language as entered. The application does not create or require parallel content fields.
- The first product image is the cover by ordering convention; no separate cover-image concept is needed.
- A screenshot of the success page is customer-held evidence. The application neither captures nor stores that screenshot.
- No ADR is required for the current decisions. They are small, reversible, and unsurprising given the stated MVP constraints.
