import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOLoginPage } from '../../../pages/bo/LoginPage';
import { BOI18n, useLocaleInContext } from '../../../utils/i18n';

test('user can login', async ({ page }) => {
  await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

  const loginPage = new BOLoginPage(page);
  const i18n = new BOI18n(page);

  await loginPage.goto(ENV.SBO_URL);
  await loginPage.login(ENV.SBO_ACCOUNT, ENV.SBO_PASSWORD);

  await expect(page).not.toHaveURL(/login/i);
  await expect(page.getByText(await i18n.t('home'), { exact: true })).toBeVisible();
});
