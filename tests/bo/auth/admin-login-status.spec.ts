import { test, expect } from '@playwright/test';
import { BOAdminPage } from '../../../pages/bo/AdminPage';
import { BOLoginPage } from '../../../pages/bo/LoginPage';
import { ENV } from '../../../utils/env';
import { BOI18n, useLocaleInContext } from '../../../utils/i18n';

test.describe('BO Admin Login Status', () => {
  test('enabled admin can login, updates last login info, and cannot login after being disabled', async ({
    page,
    browser,
  }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminLoginPage = new BOLoginPage(page);
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);

    const unique = Date.now();
    const adminAccount = `auto${unique}`;
    const adminName = 'AutoAdmin';
    const adminPassword = 'Test12345';
    const adminEmail = `autoadmin${unique}@test.com`;

    await test.step('1. Login as super admin', async () => {
      await adminLoginPage.goto(ENV.SBO_URL);
      await adminLoginPage.login(ENV.SBO_ACCOUNT, ENV.SBO_PASSWORD);

      await expect(page).not.toHaveURL(/login/i);
    });

    await test.step('2. Create enabled admin account', async () => {
      await adminPage.gotoAdminList();
      await expect(page).toHaveURL(/\/admin/);

      await adminPage.clickAddAdmin();
      await expect(page).toHaveURL(/\/admin\/add$/);

      await adminPage.createAdmin({
        account: adminAccount,
        name: adminName,
        password: adminPassword,
        email: adminEmail,
        status: 'Enable',
      });
    });

    await test.step('3. Verify enabled admin can login', async () => {
      const loginContext = await browser.newContext();
      await useLocaleInContext(loginContext, ENV.SBO_LOCALE);
      const loginTab = await loginContext.newPage();
      const loginPage = new BOLoginPage(loginTab);

      await loginPage.goto(ENV.SBO_URL);
      await loginPage.login(adminAccount, adminPassword);

      await expect(loginTab).not.toHaveURL(/login/i);

      await loginContext.close();
    });

    await test.step('4. Verify last login and last login IP are updated', async () => {
      await adminPage.gotoAdminList();
      await adminPage.searchAdmin(adminAccount);

      await adminPage.expectAdminInList(adminAccount);
      await adminPage.expectStatusSwitch(adminAccount, true);
      await adminPage.expectLastLoginUpdated(adminAccount);
      await adminPage.expectLastLoginIpUpdated(adminAccount);
    });

    await test.step('5. Change created admin status to Disable', async () => {
      await adminPage.clickEditByAccount(adminAccount);
      await expect(page).toHaveURL(/\/admin\/edit\?id=\d+$/);

      await adminPage.changeStatus('Disable');
    });

    await test.step('6. Verify disabled admin cannot login', async () => {
      const loginContext = await browser.newContext();
      await useLocaleInContext(loginContext, ENV.SBO_LOCALE);
      const loginTab = await loginContext.newPage();
      const loginPage = new BOLoginPage(loginTab);

      await loginPage.goto(ENV.SBO_URL);
      await loginPage.login(adminAccount, adminPassword);

      await expect(loginTab).toHaveURL(/login/i);
      await expect(loginTab.getByRole('alert')).toContainText(await i18n.error('000010'));

      await loginContext.close();
    });

    await test.step('7. Verify disabled admin still exists in list', async () => {
      await adminPage.gotoAdminList();
      await adminPage.searchAdminWithStatus(adminAccount, 'Disable');

      await adminPage.expectAdminInList(adminAccount);
      await adminPage.expectStatusSwitch(adminAccount, false);
    });
  });
});
