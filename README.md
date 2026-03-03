# Playwright BO

📦 **playwright-bo** is an end-to-end testing project built with [Playwright](https://playwright.dev/) using TypeScript. It currently focuses on backend (BO) workflows, automating login, logout, and other feature checks.

---

## 📁 Project Structure

```
.
├─ pages/
│   ├─ bo/
│   │   ├─ CommonPage.ts
│   │   └─ LoginPage.ts
│   └─ fo/
├─ playwright/
├─ playwright-report/
├─ test-data/
├─ test-results/
├─ tests/
│   ├─ bo/
│   │   ├─ auth.setup.ts
│   │   └─ auth/
│   │       ├─ login.spec.ts
│   │       └─ logout.spec.ts
│   ├─ regression/
│   └─ smoke/
│       └─ dashboard.spec.ts
└─ utils/
    └─ env.ts
```

- **pages/**: Page Object classes for UI interactions.
- **tests/**: Test files organized by module (bo/fo, smoke/regression, etc.).
- **playwright.config.ts**: Playwright configuration.
- **env.ts**: Environment variable loader/manager.
- **test-data/**, **test-results/**: Storage for test data and results.
- **playwright-report/**: HTML test report output.

---

## ⚙️ Setup

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

## 🚀 Running Tests

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

> 👉 Results and reports are output to `test-results/` and `playwright-report/`.

---

## 📝 Example Scripts

```json
"scripts": {
  "test": "npx playwright test",
  "report": "npx playwright show-report"
}
```

Add these to `package.json` as needed.

---

## 💡 Development Tips

- Use Page Objects (`pages/bo/*.ts`) to encapsulate repeated operations.
- Set up common preconditions (e.g. login) in `tests/bo/auth.setup.ts`.
- Organize additional folders by feature or test type (`regression/`, `smoke/`).

---

## 📦 Dependencies

- `@playwright/test` – official testing framework
- `typescript` – type support
- `dotenv` – environment variable management
- `@types/node` – Node.js type definitions

---

## ✅ Support

For help or to expand test coverage, refer to the [Playwright Docs](https://playwright.dev/docs/intro) or contact the maintainers.

---

Happy writing and running your automation tests! 🚀

---

## i18n Sync From Google Sheets

Use `npm run sync:i18n` to export a Google Sheet into i18n JSON files.

Expected sheet columns:

```csv
namespace,key,zh-TW,en,ja
bo,login.title,後台登入,Back Office Login,管理画面ログイン
fo,home.banner.cta,立即選購,Shop Now,今すぐ購入
```

- `key` is required and supports dot notation for nested JSON.
- Locale columns like `zh-TW`, `en`, `ja` become output JSON files.
- `namespace` is optional. If present, output is written to `i18n/<locale>/<namespace>.json`.
- Without `namespace`, output is written to `i18n/<locale>.json`.

Environment variables:

```ini
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SHEET_GID=0
GOOGLE_SHEET_GIDS=0,123456789,987654321
I18N_OUTPUT_DIR=i18n
```

`GOOGLE_SHEET_GIDS` supports multiple worksheet ids. If it is set, it takes priority over `GOOGLE_SHEET_GID`, and all listed worksheets are merged into the generated JSON output.

You can also override them directly:

```bash
node scripts/sync-i18n.js --sheetId=YOUR_SHEET_ID --gid=0 --outDir=playwright/i18n
```

Or export multiple worksheets in one run:

```bash
node scripts/sync-i18n.js --sheetId=YOUR_SHEET_ID --gids=0,123456789,987654321 --outDir=playwright/i18n
```
