import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOAdminPage } from '../../../pages/bo/AdminPage';
import { BOCommonPage } from '../../../pages/bo/CommonPage';
import { BOHeaderPage } from '../../../pages/bo/HeaderPage';
import { BOLoginPage } from '../../../pages/bo/LoginPage';
import { BOOperatorPage } from '../../../pages/bo/OperatorPage';
import { useLocaleInContext } from '../../../utils/i18n';

function buildAdminData(seed: string | number) {
  return {
    account: `auto${seed}`,
    name: 'AutoAdmin',
    password: 'Test12345',
    email: `autoadmin${seed}@test.com`,
  };
}

function buildOperatorData(seed: string | number) {
  return {
    account: `op${seed}`,
    name: 'AutoOperator',
    password: 'Test12345',
    email: `operator${seed}@test.com`,
  };
}

test.describe('BO Reset Password Login', () => {
  test('admin can login with new password after reset', async ({ page }) => {
    test.setTimeout(90000);
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const loginPage = new BOLoginPage(page);
    const commonPage = new BOCommonPage(page);
    const headerPage = new BOHeaderPage(page);
    const adminPage = new BOAdminPage(page);
    const data = buildAdminData(Date.now());
    const newPassword = 'Newpass123';

    await loginPage.goto(`${ENV.SBO_URL}/login`);
    await loginPage.login(ENV.SBO_AUTH_ACCOUNT, ENV.SBO_AUTH_PASSWORD);
    await expect(page).not.toHaveURL(/login/i);

    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      ...data,
      status: 'Enable',
    });
    await page.waitForTimeout(3200);

    await adminPage.gotoEditByAccount(data.account);
    await adminPage.openResetPasswordDialog();
    await adminPage.expectResetPasswordDialogVisible();
    await adminPage.fillResetPasswordForm({
      password: newPassword,
      confirmPassword: newPassword,
    });
    await adminPage.confirmResetPassword();
    await adminPage.expectAlertContainsAny([/success/i]);
    await adminPage.expectResetPasswordDialogHidden();

    await headerPage.signOut();
    await commonPage.expectLoginPageVisible();
    await loginPage.login(data.account, newPassword);
    await expect(page).not.toHaveURL(/login/i);
  });

  test('operator can login with new password after reset', async ({ page }) => {
    test.setTimeout(90000);
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const loginPage = new BOLoginPage(page);
    const commonPage = new BOCommonPage(page);
    const headerPage = new BOHeaderPage(page);
    const operatorPage = new BOOperatorPage(page);
    const data = buildOperatorData(Date.now());
    const newPassword = 'Newpass123';

    await loginPage.goto(`${ENV.SBO_URL}/login`);
    await loginPage.login(ENV.SBO_AUTH_ACCOUNT, ENV.SBO_AUTH_PASSWORD);
    await expect(page).not.toHaveURL(/login/i);

    await operatorPage.gotoAddOperator();
    await operatorPage.createOperator({
      ...data,
      status: 'Enable',
    });
    await operatorPage.expectAlertContainsAny([/success/i]);
    await page.waitForTimeout(3200);

    await operatorPage.gotoOperatorList();
    await operatorPage.searchByAccount(data.account);
    await operatorPage.clickEditByAccount(data.account);
    await operatorPage.expectEditOperatorVisible();
    await operatorPage.openResetPasswordDialog();
    await operatorPage.expectResetPasswordDialogVisible();
    await operatorPage.fillResetPasswordForm({
      password: newPassword,
      confirmPassword: newPassword,
    });
    await operatorPage.confirmResetPassword();
    await operatorPage.expectAlertContainsAny([/success/i]);
    await operatorPage.expectResetPasswordDialogHidden();

    await headerPage.signOut();
    await commonPage.expectLoginPageVisible();
    await loginPage.login(data.account, newPassword);
    await expect(page).not.toHaveURL(/login/i);
  });
});
