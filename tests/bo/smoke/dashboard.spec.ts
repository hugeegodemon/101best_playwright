import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOI18n, useLocaleInContext } from '../../../utils/i18n';

test('dashboard page opens', async ({ page }) => {
  await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

  const i18n = new BOI18n(page);

  await page.goto(`${ENV.SBO_URL}/dashboard`);
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText(await i18n.t('home'), { exact: true })).toBeVisible();
});
