# 01 — Bilingual application foundation and shared admin access

**What to build:** A deployable Verabloom application foundation with a Thai-first public shell and a protected admin shell. Visitors can switch the interface to English. An admin can sign in with the shared configured credentials, keep the session across browser restarts, open protected pages, and log out.

**Phase:** 1 — Public catalog and requests.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The TanStack Start application runs with strict TypeScript and has working public and admin route shells.
- [ ] Neon PostgreSQL and Drizzle are configured with a repeatable migration and test-database workflow.
- [ ] Shadcn/ui and the Verabloom theme are configured with typography and visual direction informed by `hiu-app` without importing unrelated complexity.
- [ ] Thai is the default interface language, and visitors can switch between complete Thai and English application-owned interface translations.
- [ ] The selected interface language persists across navigation and browser refreshes.
- [ ] Valid environment-provided credentials create a signed, secure, HTTP-only persistent session cookie.
- [ ] Invalid credentials show a clear error without revealing which credential was wrong.
- [ ] Every admin page loader and server mutation rejects unauthenticated access independently.
- [ ] Logout invalidates the session and returns the user to an unauthenticated state.
- [ ] Public routes remain accessible without authentication.
- [ ] Public and admin shells are usable on phone and desktop widths.
- [ ] Browser tests cover language switching, failed and successful login, session persistence, protected access, direct mutation rejection, and logout.
- [ ] Type checking, linting, tests, and production build pass.
