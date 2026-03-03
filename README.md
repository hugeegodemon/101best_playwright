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