import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOAdminPage } from '../../../pages/bo/AdminPage';

test.describe('BO Admin CRUD', () => {
  test('can create edit and search admin account', async ({ page }) => {
    const adminPage = new BOAdminPage(page);

    const unique = Date.now();
    const adminAccount = `auto${unique}`;
    const adminName = 'AutoAdmin';
    const adminPassword = 'Test12345';
    const adminEmail = `autoadmin${unique}@test.com`;

    await test.step('1. Enter Admin List page', async () => {
      await page.goto(`${ENV.SBO_URL}/dashboard`);
      await adminPage.gotoAdminList();
      await expect(page).toHaveURL(/\/admin/);
    });

    await test.step('2. Enter add page and create a new admin account', async () => {
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

    await test.step('3. Verify the created admin appears in list', async () => {
      await adminPage.gotoAdminList();
      await adminPage.searchAdmin(adminAccount);
      await adminPage.expectAdminInList(adminAccount);
      await adminPage.expectStatusInList(adminAccount, 'Enable');
    });

    await test.step('4. Click edit and enter edit page', async () => {
      await adminPage.clickEditByAccount(adminAccount);
      await expect(page).toHaveURL(/\/admin\/edit\?id=\d+$/);
    });

    await test.step('5. Change the status of created admin account', async () => {
      await adminPage.changeStatus('Disable');
    });

    await test.step('6. Search again and verify created admin exists in list', async () => {
      await adminPage.gotoAdminList();
      await adminPage.searchAdminWithStatus(adminAccount, 'Disable');
      await adminPage.expectAdminInList(adminAccount);
      await adminPage.expectStatusInList(adminAccount, 'Disable');
    });
  });
});