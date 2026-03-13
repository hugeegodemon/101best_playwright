import { test, expect } from './test';
import { BOI18n } from '../../../utils/i18n';
import { loginAsPrimaryUser } from '../helpers/auth';

test('user can login', async ({ page }) => {
  const i18n = new BOI18n(page);
  await loginAsPrimaryUser(page);

  await expect(page).not.toHaveURL(/login/i);
  await expect(page.getByText(await i18n.t('home'), { exact: true })).toBeVisible();
});
