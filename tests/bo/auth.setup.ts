import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { ENV } from '../../utils/env';
import { useLocaleInContext } from '../../utils/i18n';
import { BOLoginPage } from '../../pages/bo/LoginPage';

const authDir = path.resolve(process.cwd(), 'playwright/.auth');
const authFile = path.join(authDir, 'bo-user.json');

setup('authenticate', async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });
  await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

  const loginPage = new BOLoginPage(page);

  await loginPage.goto(ENV.SBO_URL);
  await loginPage.login(ENV.SBO_AUTH_ACCOUNT, ENV.SBO_AUTH_PASSWORD);
  await loginPage.expectDashboardVisible();

  await page.context().storageState({ path: authFile });
});
