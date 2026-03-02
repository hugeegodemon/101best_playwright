# Playwright BO

📦 **playwright‑bo** 是一個使用 [Playwright](https://playwright.dev/) 建構的端對端測試專案，採用 TypeScript 編寫。
目前專注於後台（BO）流程，自動化登入、登出與其他功能檢查。

---

## 📁 專案結構

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

- **pages/**：Page Object 模式的頁面類別。
- **tests/**：測試檔案，依模組區分（bo/fo、smoke/regression 等）。
- **playwright.config.ts**：Playwright 配置。
- **env.ts**：環境變數載入與管理。
- **test-data/**、**test-results/**：測試資料與結果輸出。
- **playwright-report/**：HTML 測試報告。

---

## ⚙️ 環境設定

1. **安裝依賴**

   ```bash
   npm install
   ```

2. **安裝 Playwright 瀏覽器**

   ```bash
   npx playwright install
   ```

3. **環境變數**

   建立 `.env` 檔案（可參考 `utils/env.ts`）：

   ```ini
   BASE_URL=https://your-app-url
   USERNAME=your-username
   PASSWORD=your-password
   ```

---

## 🚀 執行測試

- **執行全部測試**

  ```bash
  npx playwright test
  ```

- **執行指定資料夾/檔案**

  ```bash
  npx playwright test tests/bo/auth/login.spec.ts
  ```

- **產生 HTML 報告後開啟**

  ```bash
  npx playwright show-report
  ```

> 👉 測試結果與報告會輸出至 `test-results/` 與 `playwright-report/`。

---

## 📝 範例指令

```json
"scripts": {
  "test": "npx playwright test",
  "report": "npx playwright show-report"
}
```

可視需要在 `package.json` 中新增。

---

## 💡 開發提示

- 使用 Page Object (`pages/bo/*.ts`) 將重複操作封裝。
- 在 `tests/bo/auth.setup.ts` 中設置共用前置動作（如登入）。
- 可依照分支或測試類型建立更多資料夾（如 `regression/`, `smoke/`）。

---

## 📦 相依套件

- `@playwright/test` – 官方測試框架
- `typescript` – 型別支援
- `dotenv` – 環境變數
- `@types/node` – Node.js 型別定義

---

## ✅ 支援

如需協助或想擴充測試範圍，可參考 [Playwright Docs](https://playwright.dev/docs/intro) 或聯絡維護者。

---

歡迎開始編寫和執行你的自動化測試！🚀