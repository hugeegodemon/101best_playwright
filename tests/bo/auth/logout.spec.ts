import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOLoginPage } from '../../../pages/bo/LoginPage';
import { BOCommonPage } from '../../../pages/bo/CommonPage';

test('user can logout', async ({ page }) => {
  const loginPage = new BOLoginPage(page);
  const commonPage = new BOCommonPage(page);

  await loginPage.goto(ENV.SBO_URL);
  await loginPage.login(ENV.SBO_ACCOUNT, ENV.SBO_PASSWORD);

  await commonPage.logout();

  await expect(page.getByPlaceholder('Account')).toBeVisible();
});