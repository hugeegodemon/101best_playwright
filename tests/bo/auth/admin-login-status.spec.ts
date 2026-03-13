import { test, expect } from './test';
import { BOAdminPage } from '../../../pages/bo/AdminPage';
import { BOI18n } from '../../../utils/i18n';
import { loginAsPrimaryUser, loginToBackOffice, withFreshLoginPage } from '../helpers/auth';
import { buildAdminData } from '../helpers/data';

test.describe('BO Admin Login Status', () => {
  test('enabled admin can login, updates last login info, and cannot login after being disabled', async ({
    page,
    browser,
  }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const admin = buildAdminData();

    await test.step('1. Login as super admin', async () => {
      await loginAsPrimaryUser(page);
      await expect(page).not.toHaveURL(/login/i);
    });

    await test.step('2. Create enabled admin account', async () => {
      await adminPage.gotoAdminList();
      await expect(page).toHaveURL(/\/admin/);

      await adminPage.clickAddAdmin();
      await expect(page).toHaveURL(/\/admin\/add$/);

      await adminPage.createAdmin({
        ...admin,
        status: 'Enable',
      });
    });

    await test.step('3. Verify enabled admin can login', async () => {
      await withFreshLoginPage(browser, async (loginPage) => {
        await loginToBackOffice(loginPage, admin.account, admin.password);
        await expect(loginPage).not.toHaveURL(/login/i);
      });
    });

    await test.step('4. Verify last login and last login IP are updated', async () => {
      await adminPage.gotoAdminList();
      await adminPage.searchAdmin(admin.account);

      await adminPage.expectAdminInList(admin.account);
      await adminPage.expectStatusSwitch(admin.account, true);
      await adminPage.expectLastLoginUpdated(admin.account);
      await adminPage.expectLastLoginIpUpdated(admin.account);
    });

    await test.step('5. Change created admin status to Disable', async () => {
      await adminPage.clickEditByAccount(admin.account);
      await expect(page).toHaveURL(/\/admin\/edit\?id=\d+$/);

      await adminPage.changeStatus('Disable');
    });

    await test.step('6. Verify disabled admin cannot login', async () => {
      await withFreshLoginPage(browser, async (loginPage) => {
        await loginToBackOffice(loginPage, admin.account, admin.password);
        await expect(loginPage).toHaveURL(/login/i);
        await expect(loginPage.getByRole('alert')).toContainText(await i18n.error('000010'));
      });
    });

    await test.step('7. Verify disabled admin still exists in list', async () => {
      await adminPage.gotoAdminList();
      await adminPage.searchAdminWithStatus(admin.account, 'Disable');

      await adminPage.expectAdminInList(admin.account);
      await adminPage.expectStatusSwitch(admin.account, false);
    });
  });
});
