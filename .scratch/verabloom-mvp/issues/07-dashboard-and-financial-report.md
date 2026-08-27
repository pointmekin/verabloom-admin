# 07 — Dashboard and financial report

**What to build:** Admins can see the shop's current cash position and outstanding customer balances at a glance, compare received income and expenses across the latest six months, and inspect the payments and expenses behind totals for an inclusive reporting period.

**Phase:** 3 — Understand the finances.

**Blocked by:** 05 — Record payments and outstanding amounts; 06 — Record shop expenses.

**Status:** ready-for-agent

- [ ] The dashboard shows all-time received income, expenses, net cash, outstanding amount, and pending-request count.
- [ ] Received income is the sum of recorded payments, including retained payments on cancelled orders.
- [ ] Net cash equals received income minus expenses.
- [ ] Outstanding amount includes non-cancelled orders only and never falls below zero per order.
- [ ] The dashboard renders a Shadcn chart comparing received income and expenses by Bangkok calendar month for the latest six months.
- [ ] Empty financial data produces useful zero-value cards and an understandable empty chart state.
- [ ] The finance page lists payments with customer, order reference, amount, date, and method.
- [ ] Each payment row links to its order.
- [ ] The finance page lists expenses with description, payer, amount, date, and optional quantity.
- [ ] An admin can choose an inclusive reporting-period start and end date.
- [ ] The report recalculates received income, expenses, and net cash and lists only matching payment and expense rows.
- [ ] Payment dates and expense dates determine report inclusion; Bangkok month boundaries determine chart grouping.
- [ ] Finance tables become readable stacked records on narrow screens.
- [ ] Deterministic tests cover empty data, partial and excess payments, cancelled orders, retained payments, net cash, inclusive date boundaries, and Bangkok month boundaries.
- [ ] Browser tests use known dated fixtures to verify dashboard totals, chart data, linked tables, and reporting-period results.
- [ ] Type checking, linting, tests, and production build pass.
