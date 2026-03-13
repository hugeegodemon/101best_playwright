import { test, expect } from './test';
import { BOAdminPage } from '../../../pages/bo/AdminPage';
import { buildAdminData } from '../helpers/data';

test.describe('BO Admin CRUD', () => {
  test('can create edit and search admin account', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const admin = buildAdminData();

    await test.step('1. Enter Admin List page', async () => {      await adminPage.gotoAdminList();
      await expect(page).toHaveURL(/\/admin/);
    });

    await test.step('2. Enter add page and create a new admin account', async () => {
      await adminPage.clickAddAdmin();
      await expect(page).toHaveURL(/\/admin\/add$/);

      await adminPage.createAdmin({
        ...admin,
        status: 'Enable',
      });
    });

    await test.step('3. Verify the created admin appears in list', async () => {
      await adminPage.gotoAdminList();
      await adminPage.searchAdmin(admin.account);
      await adminPage.expectAdminInList(admin.account);
      await adminPage.expectStatusInList(admin.account, 'Enable');
    });

    await test.step('4. Click edit and enter edit page', async () => {
      await adminPage.clickEditByAccount(admin.account);
      await expect(page).toHaveURL(/\/admin\/edit\?id=\d+$/);
    });

    await test.step('5. Change the status of created admin account', async () => {
      await adminPage.changeStatus('Disable');
    });

    await test.step('6. Search again and verify created admin exists in list', async () => {
      await adminPage.gotoAdminList();
      await adminPage.searchAdminWithStatus(admin.account, 'Disable');
      await adminPage.expectAdminInList(admin.account);
      await adminPage.expectStatusInList(admin.account, 'Disable');
    });
  });
});
