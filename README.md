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
|   |   |-- auth.setup.ts
|   |   `-- auth/
|   |       |-- login.spec.ts
|   |       `-- logout.spec.ts
|   |-- regression/
|   `-- smoke/
|       `-- dashboard.spec.ts
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
   SBO_LOGIN_ACCOUNT=your_login_test_account
   SBO_LOGIN_PASSWORD=your_login_test_password
   SBO_AUTH_ACCOUNT=your_authenticated_test_account
   SBO_AUTH_PASSWORD=your_authenticated_test_password
   ```

---

## Running Tests

- **Run all tests**

  ```bash
  npx playwright test
  ```

- **Run a specific folder/file**

  ```bash
  npx playwright test tests/bo/auth/login.spec.ts
  ```

- **Run specific project**

  ```bash
  npx playwright test --project=bo-no-auth
  npx playwright test --project=bo-authenticated
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
  "test": "npx playwright test",
  "report": "npx playwright show-report"
}
```

Add these to `package.json` as needed.

---

## Development Tips

- Use Page Objects (`pages/bo/*.ts`) to encapsulate repeated operations.
- Set up common preconditions (e.g. login) in `tests/bo/auth.setup.ts`.
- Organize additional folders by feature or test type (`regression/`, `smoke/`).

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
- Multiple worksheets can be merged into the same output.

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
