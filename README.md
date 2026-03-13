# Playwright BO

**playwright-bo** is an end-to-end testing project built with [Playwright](https://playwright.dev/) using TypeScript. It currently focuses on backend (BO) workflows, automating login, logout, and other feature checks.

---

## Project Structure

```text
.
|-- pages/
|   |-- bo/
|   |   |-- CommonPage.ts
|   |   `-- LoginPage.ts
|   `-- fo/
|-- playwright/
|-- playwright-report/
|-- test-data/
|-- test-results/
|-- tests/
|   |-- bo/
|   |   |-- global.setup.ts
|   |   |-- auth/
|   |       |-- login.spec.ts
|   |       |-- logout.spec.ts
|   |       `-- test.ts
|   |   `-- smoke/
|   |       |-- dashboard.spec.ts
|   |       `-- test.ts
|   |-- regression/
`-- utils/
    `-- env.ts
```

- **pages/**: Page Object classes for UI interactions.
- **tests/**: Test files organized by module (bo/fo, smoke/regression, etc.).
- **playwright.config.ts**: Playwright configuration.
- **env.ts**: Environment variable loader/manager.
- **test-data/**, **test-results/**: Storage for test data and results.
- **playwright-report/**: HTML test report output.

---

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Install Playwright browsers**

   ```bash
   npx playwright install
   ```

3. **Environment variables**

   Create a `.env` file (refer to `utils/env.ts`):

   ```ini
   SBO_URL=https://your-bo-url.com
   SBO_ACCOUNT=your_login_test_account
   SBO_PASSWORD=your_login_test_password
   SBO_AUTH_ACCOUNT=your_authenticated_test_account
   SBO_AUTH_PASSWORD=your_authenticated_test_password
   SBO_SMOKE_ACCOUNT=your_smoke_test_account
   SBO_SMOKE_PASSWORD=your_smoke_test_password
   SBO_LOCALE=en-us
   ```

   `SBO_LOCALE` is optional. If omitted, tests will not prewrite `localStorage.language` and will instead follow the language value the site sets for itself.
   `SBO_SMOKE_ACCOUNT` and `SBO_SMOKE_PASSWORD` are recommended for smoke/global setup isolation. If omitted, smoke falls back to `SBO_ACCOUNT` and `SBO_PASSWORD`.

---

## Running Tests

- **Run all tests**

  ```bash
  npm test
  ```

- **Run a specific folder/file**

  ```bash
  npx playwright test tests/bo/auth/login.spec.ts
  ```

- **Run auth or smoke suites**

  ```bash
  npx playwright test tests/bo/auth --grep-invert "@isolated-session" --workers=1
  npx playwright test tests/bo/auth --grep "@isolated-session" --workers=1
  npx playwright test tests/bo/smoke --grep-invert "@serial|@isolated-session"
  npx playwright test tests/bo/smoke --grep "@serial" --grep-invert "@isolated-session" --workers=1
  npx playwright test tests/bo/smoke --grep "@isolated-session" --workers=1
  ```

- **Run smoke in parallel-safe and single-worker batches**

  ```bash
  npx playwright test tests/bo/smoke --grep-invert "@serial"
  npx playwright test tests/bo/smoke --grep "@serial" --workers=1
  ```

- **Run with visible browser**

  ```bash
  npx playwright test --headed
  ```

- **Generate and open HTML report**

  ```bash
  npx playwright show-report
  ```

Results and reports are output to `test-results/` and `playwright-report/`.

---

## Example Scripts

```json
"scripts": {
  "test": "npm run test:bo:auth && npm run test:bo:smoke && npm run test:bo:serial && npm run test:bo:smoke:session && npm run test:bo:auth:session",
  "test:bo:auth": "playwright test tests/bo/auth --grep-invert \"@isolated-session\" --workers=1",
  "test:bo:auth:session": "playwright test tests/bo/auth --grep \"@isolated-session\" --workers=1",
  "test:bo:smoke": "playwright test tests/bo/smoke --grep-invert \"@serial|@isolated-session\"",
  "test:bo:serial": "playwright test tests/bo/smoke --grep \"@serial\" --grep-invert \"@isolated-session\" --workers=1",
  "test:bo:smoke:session": "playwright test tests/bo/smoke --grep \"@isolated-session\" --workers=1",
  "report": "playwright show-report"
}
```

These are the CI-friendly commands now used in `package.json`.
Auth commands set `PW_SKIP_BO_GLOBAL_SETUP=1`, so they do not prepare or consume the shared smoke storage state.

## CI Split

Recommended CI order:

```bash
npx playwright test tests/bo/auth --grep-invert "@isolated-session" --workers=1
npx playwright test tests/bo/smoke --grep-invert "@serial|@isolated-session"
npx playwright test tests/bo/smoke --grep "@serial" --grep-invert "@isolated-session" --workers=1
npx playwright test tests/bo/smoke --grep "@isolated-session" --workers=1
npx playwright test tests/bo/auth --grep "@isolated-session" --workers=1
```

Current `@serial` specs:

- `tests/bo/smoke/site-crud.spec.ts`
- `tests/bo/smoke/system-bank-list.spec.ts`
- `tests/bo/smoke/system-bank-crud.spec.ts`
- `tests/bo/smoke/system-bank-validation.spec.ts`
- `tests/bo/smoke/system-bank-edit-validation.spec.ts`

Current `@isolated-session` specs:

- `tests/bo/smoke/header.spec.ts` (`sign out action returns user to login page`)
- `tests/bo/auth/reset-password-login.spec.ts`

---

## Development Tips

- Use Page Objects (`pages/bo/*.ts`) to encapsulate repeated operations.
- Keep cross-suite smoke login bootstrap in `tests/bo/global.setup.ts`.
- Auth commands skip `tests/bo/global.setup.ts`; only smoke-related commands prepare the shared smoke session.
- Use per-suite fixtures in `tests/bo/auth/test.ts` and `tests/bo/smoke/test.ts` for defaults like locale, storage state, and landing page.
- Put reusable BO test helpers such as login flows and test-data builders in `tests/bo/helpers/`.
- For specs that cannot safely share environment state, tag them with `@serial` and run them in a separate CI step with `--workers=1` instead of adding a dedicated project.
- For auth or smoke specs that intentionally log out, re-login, or otherwise invalidate shared sessions, tag them with `@isolated-session` and run them after the shared-session batches.

---

## Dependencies

- `@playwright/test`: official testing framework
- `typescript`: type support
- `dotenv`: environment variable management
- `@types/node`: Node.js type definitions

---

## Support

For help or to expand test coverage, refer to the [Playwright Docs](https://playwright.dev/docs/intro) or contact the maintainers.

---

## i18n Sync From Google Sheets

Use `node scripts/sync-i18n.js` to export translations from Google Sheets into i18n JSON files.

The script only supports this worksheet layout:

- Row 1: labels for human-readable descriptions
- Row 2: locale codes
- Column A: translation keys
- Column B onward: translated values for each locale
- Row 3 onward: translation data

Example:

```csv
說明,英文,繁體中文,簡體中文
代碼,en-us,zh-tw,zh-cn
withdraw,Withdrawal,提款,提款
withdrawal_amount,Withdrawal Amount,提款金額,提款金额
login.title,Back Office Login,後台登入,后台登录
```

- `A2` accepts `key`, `code`, `代碼`, or `代码`.
- Translation keys support dot notation and are written as nested JSON.
- Each locale code in row 2 becomes one output file, for example `i18n/en-us.json` or `i18n/zh-tw.json`.
- Worksheets are grouped by order and merged into domains in a repeating cycle:
- Sheet 1, 5, 9... => `error_code`
- Sheet 2, 6, 10... => merged into both `backend` and `frontend`
- Sheet 3, 7, 11... => `backend`
- Sheet 4, 8, 12... => `frontend`
- Each locale file contains `error_code`, `backend`, and `frontend` objects at the top level.

Environment variables:

```ini
GOOGLE_SHEET_ID=your_google_sheet_id
I18N_OUTPUT_DIR=i18n
```

The script discovers worksheet ids from the spreadsheet page automatically, so `.env` only needs `GOOGLE_SHEET_ID`. If auto-discovery fails, it falls back to the default worksheet `gid=0`.

You can also override them directly:

```bash
node scripts/sync-i18n.js --sheetId=YOUR_SHEET_ID --gid=0 --outDir=playwright/i18n
```

Or export multiple worksheets in one run:

```bash
node scripts/sync-i18n.js --sheetId=YOUR_SHEET_ID --gids=0,123456789,987654321 --outDir=playwright/i18n
```
