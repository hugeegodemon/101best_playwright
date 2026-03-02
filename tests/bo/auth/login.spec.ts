import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOLoginPage } from '../../../pages/bo/LoginPage';

test('user can login', async ({ page }) => {
  const loginPage = new BOLoginPage(page);

  await loginPage.goto(ENV.SBO_URL);
  await loginPage.login(ENV.SBO_ACCOUNT, ENV.SBO_PASSWORD);

  await expect(page).not.toHaveURL(/login/i);
  await expect(page.getByText(/Home/i)).toBeVisible();
});