import { test, expect } from './test';
import { BOCommonPage } from '../../../pages/bo/CommonPage';
import { loginAsPrimaryUser } from '../helpers/auth';

test('user can logout', async ({ page }) => {
  const commonPage = new BOCommonPage(page);
  await loginAsPrimaryUser(page);

  await commonPage.logout();

  await commonPage.expectLoginPageVisible();
});
