---
target: src/routes/admin/orders/index.tsx
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-27T17-58-09Z
slug: src-routes-admin-orders-index-tsx
---
Method: single-context assessment. Browser visualization was unavailable, so no in-page overlay was created.

## Design health score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2 | Search and status changes provide no loading, result count, or applied-filter feedback. |
| 2 | Match System / Real World | 3 | The Thai labels fit the shop, but raw `YYYY-MM-DD` dates read like data rather than a production deadline. |
| 3 | User Control and Freedom | 2 | Status can return to All, but a search or no-result view has no visible clear action. |
| 4 | Consistency and Standards | 3 | It reuses the project table, chips, and controls well; the mobile card is only partly tappable. |
| 5 | Error Prevention | 2 | The list does not foreground deadline or state well enough to prevent triage mistakes. |
| 6 | Recognition Rather Than Recall | 3 | Search, labels, owners, and delivery tags are legible, but the most important signals land low in the mobile card. |
| 7 | Flexibility and Efficiency | 1 | There are no quick status views, keyboard accelerators, or row-level fast path for frequent triage. |
| 8 | Aesthetic and Minimalist Design | 2 | The calm visual system works, but the oversized heading and eight equally weighted fields slow scanning. |
| 9 | Error Recovery | 2 | A no-results state does not explain the active criteria or offer a one-tap reset. |
| 10 | Help and Documentation | 0 | There is no just-in-time explanation of how pending requests differ from confirmed orders. |
| **Total** | | **20/40** | **Acceptable. Significant improvements needed.** |

## Design specificity verdict

The page feels like Verabloom in its language, owner badges, delivery badges, and restrained admin tone. Its information structure is generic. The same table could list support tickets or warehouse jobs with little change. For a three-person flower shop, the first thing an owner should see is what needs attention today, who owns it, and where it is in the flow.

The deterministic scan returned zero findings for `src/routes/admin/orders/index.tsx`. That is a clean source-level result, not proof of a polished screen. It cannot inspect the live layout from this environment, so it did not create an overlay. No detector findings were treated as false positives.

## Overall impression

The foundation is calm and coherent. It is also too polite about urgency. A user standing at a workbench should be able to spot the next request to act on before reading a large title, a search field, a filter, and eight facts per order.

## What's working

- The page uses plain Thai labels, real owner names, and delivery-specific chips. That reduces translation from system language into shop language.
- Search and status filtering are kept close to the list, and the controls have labels rather than relying on icon meaning.
- The mobile table transformation avoids horizontal scrolling. The `data-label` treatment is a sensible base for small screens.

## Priority issues

### [P1] The mobile list buries triage signals

**Why it matters.** Each order becomes an eight-row card. Status, required date, and value sit late in the card, while the main page title consumes a large slice of the first viewport. Owners have to read through details before they can decide what needs attention.

**Fix.** Keep the desktop table. On narrow screens, make a compact order summary the primary row: request reference, status, required date, owner, and customer. Put product, delivery method, contact, and value behind an explicit Details disclosure or on the order page. Reduce the orders heading to an admin-specific fixed scale.

**Suggested command.** `/impeccable layout`

### [P1] Filtered and empty results leave no recovery path

**Why it matters.** `noOrders` looks the same whether the shop has no work or the current search and status combination simply matches nothing. There is no result count, applied-filter summary, or clear button. That makes a dead-end state look like missing data.

**Fix.** When criteria are active, show the count and a compact "Clear search and status" action. Change the empty copy to distinguish an empty shop from "No orders match these filters." Preserve the search text when the user switches status.

**Suggested command.** `/impeccable harden`

### [P1] A row-shaped card has only one small navigation target

**Why it matters.** On mobile the card looks like one record, but only the request reference opens it. That asks a busy, one-handed user to hit a small text link rather than the thing they are reading.

**Fix.** Make the mobile summary's leading region an obvious full-width order link, or add a clearly labelled "Open order" control with a comfortable target. Do not make the desktop table row a fake link.

**Suggested command.** `/impeccable adapt`

### [P2] Dates and empty values look like raw database output

**Why it matters.** `2026-08-28` is less scannable than a Thai-localized calendar date. `— ฿` still attaches a currency mark to the absence of a value, which reads like an incomplete calculation.

**Fix.** Format required dates for the active locale, ideally with a short weekday where useful. Render a value as either a formatted baht amount or one whole missing-value label, never a dash followed by `฿`.

**Suggested command.** `/impeccable clarify`

### [P2] The all-orders view offers no fast triage route

**Why it matters.** Records sort by creation time, so an urgent delivery date can be buried. The header badge reports pending work, but the list opens on all statuses and makes the owner choose from seven filter values to focus it.

**Fix.** Give pending review a visible quick view and state its count near the list. Keep All as a secondary choice. If the workflow confirms that deadlines drive fulfilment, sort or group active orders by required date instead of raw creation time.

**Suggested command.** `/impeccable shape`

## Persona red flags

**Chompooh, handling messages at the workbench.** She wants to open the next pending request with one thumb. The count in the header says there is work, but the page lands on all orders, and the link to open an order is a small reference inside a dense card.

**Alex, a repeat admin user.** He can search and filter, but he has no fast pending view, no visible filter summary, and no accelerator for repetitive triage. The extra taps become friction every time the team checks the list.

**Jordan, joining the shared workflow for the first time.** A blank result state gives no clue whether there are truly no orders or whether a prior search/status filter is hiding them. The raw date and `— ฿` also make it harder to tell whether an order lacks information or the page failed to load it.

## Minor observations

- `Admin team only` repeats information the authenticated admin shell already conveys and competes with the operational title.
- The status filter's six states are legitimate domain choices, but the control needs a stronger default and applied-state feedback.
- The status badge is visually quieter than owner and delivery badges even though status drives the next action.

## Cognitive load

This is high cognitive load on mobile. Five checklist items fail: chunking, grouping, visual hierarchy, minimal choices, and progressive disclosure. The eight data fields remain equally exposed, so the person scanning for deadlines and pending work has to sift through fields that matter only after opening an order.
