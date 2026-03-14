# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Playwright E2E testing suite for a Back Office (BO) web application built with Element Plus (Vue). TypeScript + `@playwright/test`. Tests cover auth flows and smoke tests for BO features (admin/operator/site/bank management, carousels, game providers).

## Setup

```bash
npm install
npx playwright install
```

Create a `.env` file with:
```ini
SBO_URL=https://your-bo-url.com
SBO_ACCOUNT=your_login_test_account
SBO_PASSWORD=your_login_test_password
SBO_AUTH_ACCOUNT=your_authenticated_test_account
SBO_AUTH_PASSWORD=your_authenticated_test_password
SBO_SMOKE_ACCOUNT=your_smoke_test_account   # optional, falls back to SBO_ACCOUNT
SBO_SMOKE_PASSWORD=your_smoke_test_password # optional, falls back to SBO_PASSWORD
SBO_MANAGED_SITE=your_managed_test_site
SBO_LOCALE=en-us                            # optional
```

## Commands

```bash
# Run all test suites in CI order
npm test

# Run specific suites individually
npm run test:bo:auth          # auth tests (non-session-destructive), workers=1
npm run test:bo:auth:session  # auth tests tagged @isolated-session, workers=1
npm run test:bo:smoke         # smoke tests (parallel-safe)
npm run test:bo:serial        # smoke tests tagged @serial, workers=1
npm run test:bo:smoke:session # smoke tests tagged @isolated-session, workers=1

# Run a single spec file
npx playwright test tests/bo/smoke/dashboard.spec.ts

# Run with visible browser
npx playwright test --headed

# Open HTML report
npx playwright show-report

# Sync i18n translations from Google Sheets
npm run sync:i18n
```

Auth scripts set `PW_SKIP_BO_GLOBAL_SETUP=1` to skip the shared smoke session bootstrap.

## Architecture

### Session Model & Account Types

Three distinct account types serve different test contexts:
- **Primary** (`SBO_ACCOUNT/SBO_PASSWORD`): Used by auth specs for login/logout testing via `loginAsPrimaryUser()`
- **Authenticated** (`SBO_AUTH_ACCOUNT/SBO_AUTH_PASSWORD`): Used by `@isolated-session` specs (password reset flows) via `loginAsAuthenticatedUser()`
- **Smoke** (`SBO_SMOKE_ACCOUNT/SBO_SMOKE_PASSWORD`): Used by `global.setup.ts` to create shared storage state
- **Managed Site** (`SBO_MANAGED_SITE`): Shared BO site selector target for specs that need a stable, reusable test site

Session flow:
- **`tests/bo/global.setup.ts`**: Logs in as smoke user, saves session to `playwright/.auth/bo-smoke-user.json`. Only runs for smoke suite commands (skipped when `PW_SKIP_BO_GLOBAL_SETUP=1`).
- **`tests/bo/smoke/test.ts`**: Extends base `test` with saved storage state; navigates to `/dashboard` before each test. Import `test` and `expect` from here for smoke specs.
- **`tests/bo/auth/test.ts`**: Extends base `test` with locale injection only (no stored session, no pre-navigation). Import from here for auth specs.

Auth helpers in `tests/bo/helpers/auth.ts`:
- `loginAsPrimaryUser(page)` — logs in with SBO_ACCOUNT
- `loginAsAuthenticatedUser(page)` — logs in with SBO_AUTH_ACCOUNT
- `loginToBackOffice(page, account, password)` — generic login
- `withFreshLoginPage(browser, callback)` — creates an isolated browser context for login verification

### Page Object Layer (`pages/bo/`)

Every page object follows the same pattern:
- Constructor receives `Page`, creates `BOSidebarPage` for sidebar navigation, creates `BOI18n` for text resolution
- Private `text(key)` method wraps `this.i18n.t(key)` for backend namespace lookups
- Some pages add `copy(key, namespace, vars)` for parameterized translations and `label(key)` that falls back from backend to frontend namespace
- Action methods (e.g. `clickSearch()`, `save()`, `createAdmin()`) include post-action waits
- Assertion methods prefixed with `expect` (e.g. `expectAdminInList()`, `expectRequiredValidationErrors()`)

Page objects and what they cover:
- **CommonPage** — shared wait utilities (`waitForUiSettled`, `waitForNetworkSettled`, `waitForVisibleSelectOptions`, `waitForAlertOrIdle`) and base actions (`logout`, `openUserMenu`)
- **LoginPage** — `goto()`, `login()` with post-login dialog handling, `expectDashboardVisible()`
- **SidebarPage** — menu expand/collapse/click at 2 and 3 levels deep via i18n keys
- **HeaderPage** — navbar toggle, language selector, account popover, password dialog, sign out
- **AdminPage** — admin CRUD, search/filter, reset password dialog, status management
- **OperatorPage** — operator CRUD with site/role selection, status dialog, search/filter, reset password
- **OperatorRolePage** — role CRUD with pagination traversal to find roles across pages
- **SiteListPage** — site CRUD with two-step wizard (basic info → game settings), image upload, filter/search
- **GameProviderPage** — provider list, game list drill-down, add/edit game dialog, API settings dialog
- **CarouselPage** — carousel CRUD with hyperlink/specific-game/none link types, image upload, schedule/publish/delete, archive filters
- **SystemBankListPage** — bank CRUD, region-based filtering, add/edit page navigation

### Element Plus Locator Patterns

The BO app uses Element Plus. Common selectors used throughout page objects:
- `.page-box` — page sections (filter box is `.nth(0)`, list box is `.nth(1)`)
- `tr.el-table__row` — table rows; find specific rows with `.filter({ has: page.locator('td .cell', { hasText: text }) })`
- `.el-select__wrapper` — select trigger; click to open dropdown
- `.el-select-dropdown:visible .el-select-dropdown__item` — visible select options
- `.el-dialog` — dialog containers; use `.last()` when multiple may exist
- `.el-form-item__error` — validation error messages
- `.bg-mainBlue` — edit/action buttons in table rows
- `.el-switch` — toggle switches for status
- `.el-message, [role="alert"]` — toast/alert messages
- `button.btn-primary` — primary action buttons (search, save, confirm)
- `button.btn-blue` — secondary action buttons (reset, cancel, add)
- `.center-btn` — form action area at bottom of create/edit pages

### i18n (`utils/i18n.ts`)

`BOI18n` reads locale JSON files from `i18n/` and resolves translation keys. **Always use `BOI18n.t(key)` instead of hard-coded UI text** for button labels, status text, success/error messages, and dialog titles.

- Default namespace: `'backend'`; also supports `'frontend'` and `'error_code'`
- Error messages use `i18n.error(code)` which formats as `"CODE MESSAGE"` (e.g. `"000063 Account already exists"`)
- Status text has multiple possible i18n keys per status (e.g. Enable → `simple_status_1`, `basic_status_1`, `status_1`, `enable`). Page objects try all variants via `statusTexts()` / `formStatusTexts()` with fallback by index.
- Locale is injected into browser context via `useLocaleInContext()` which sets `localStorage.language`

### Test Data (`tests/bo/helpers/data.ts`)

Use the builders here for all generated test data — never use raw `Date.now()` or `Math.random()` in specs:
- `uniqueSeed()`, `uniqueDigits(length)`, `uniqueAlpha(length)`, `uniqueUpperAlnum(length)` — base generators
- `buildAdminData(seed?)` — returns `{ account, name, password, email }`
- `buildOperatorData(seed?)` — returns `{ account, name, password, email }`
- `buildRoleName(prefix?)` — returns role name string
- `buildSiteDraft(prefix)` — returns `{ suffix, siteName, hiddenCode, frontendUrl, backendUrl }`
- `buildGameDraft(prefix?)` — returns `{ suffix, gameName, editedGameName, code }`
- `buildSystemBankDraft(codePrefix?, namePrefix?)` — returns `{ suffix, bankCode, bankName }`
- `buildCarouselLinkDraft(prefix?)` — returns `{ suffix, url, editedUrl }`
- `buildMissValue(prefix, length?)` — for intentionally non-matching search values
- `dateTimeOffset(minutes)` — formatted datetime string offset from now

### Test Tagging

- **`@serial`**: Tests that mutate shared environment data or are order-sensitive. Run with `--workers=1`. Use `test.describe.configure({ mode: 'serial' })` inside the describe block. Current: `site-crud`, `system-bank-*` specs.
- **`@isolated-session`**: Tests that sign out, re-login, reset password, or otherwise destroy shared session state. Run after all shared-session batches. Current: `header.spec.ts` (sign out test), `reset-password-login.spec.ts`.

Do not add a new Playwright project to control execution order — use these tags instead.

### Test Fixtures

Image test fixtures live in `tests/fixtures/images/`. Referenced via:
```ts
const fixture = (name: string) => path.resolve(process.cwd(), 'tests/fixtures/images', name);
```
Includes valid and invalid images for logo upload validation (dimensions, format, file size).

## Coding Rules (from `docs/bo-coding-guardrails.md`)

1. UI action flows reused across tests → move to `pages/bo/`, not specs
2. No `waitForTimeout` in spec files unless there is no observable UI signal (document the reason)
3. Every async action needs a post-action wait (prefer `toBeVisible`, `toHaveURL`, `expect.poll`)
4. Use `BOI18n` for all UI text assertions
5. Use builders from `tests/bo/helpers/data.ts` for generated data
6. Tag session-destructive tests `@isolated-session`; tag environment-mutating tests `@serial`
7. Specs should express business flow (go to page → perform action → verify result), not driver details
8. Fix flaky timing issues in the page object layer, not in individual specs
9. For assertion flexibility, use `expectAlertContainsAny(messages)` / `expectFieldErrorContains(key, messages)` pattern — pass an array of possible i18n keys and regex fallbacks since exact error text may vary by locale or API version
10. When adding a new entity page object, follow the existing pattern: extend with `BOSidebarPage` for nav, `BOI18n` for text, private `text(key)` helper, and include both action and assertion methods
