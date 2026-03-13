import { test, expect } from './test';
import { BOI18n } from '../../../utils/i18n';

test('dashboard page opens', async ({ page }) => {

  const i18n = new BOI18n(page);
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText(await i18n.t('home'), { exact: true })).toBeVisible();
});
