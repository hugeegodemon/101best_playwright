import { test, expect } from './test';
import { BOAdminPage } from '../../../pages/bo/AdminPage';
import { BOCommonPage } from '../../../pages/bo/CommonPage';
import { BOHeaderPage } from '../../../pages/bo/HeaderPage';
import { BOLoginPage } from '../../../pages/bo/LoginPage';
import { BOOperatorPage } from '../../../pages/bo/OperatorPage';
import { BOI18n } from '../../../utils/i18n';
import { loginAsAuthenticatedUser } from '../helpers/auth';
import { buildAdminData, buildOperatorData } from '../helpers/data';

test.describe('BO Reset Password Login @isolated-session', () => {
  test('admin can login with new password after reset', async ({ page }) => {
    test.setTimeout(90000);

    const loginPage = new BOLoginPage(page);
    const commonPage = new BOCommonPage(page);
    const headerPage = new BOHeaderPage(page);
    const adminPage = new BOAdminPage(page);
    const data = buildAdminData();
    const newPassword = 'Newpass123';

    await loginAsAuthenticatedUser(page);
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
    await adminPage.expectResetPasswordSuccessAlert();
    await adminPage.expectResetPasswordDialogHidden();

    await headerPage.signOut();
    await commonPage.expectLoginPageVisible();
    await loginPage.login(data.account, newPassword);
    await expect(page).not.toHaveURL(/login/i);
  });

  test('operator can login with new password after reset', async ({ page }) => {
    test.setTimeout(90000);

    const loginPage = new BOLoginPage(page);
    const commonPage = new BOCommonPage(page);
    const headerPage = new BOHeaderPage(page);
    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    const data = buildOperatorData();
    const newPassword = 'Newpass123';

    await loginAsAuthenticatedUser(page);
    await expect(page).not.toHaveURL(/login/i);

    await operatorPage.gotoAddOperator();
    await operatorPage.createOperator({
      ...data,
      status: 'Enable',
    });
    await operatorPage.expectAlertContainsAny([
      await i18n.t('success'),
      await i18n.t('added_successfully'),
    ]);
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
    await operatorPage.expectResetPasswordSuccessAlert();
    await operatorPage.expectResetPasswordDialogHidden();

    await headerPage.signOut();
    await commonPage.expectLoginPageVisible();
    await loginPage.login(data.account, newPassword);
    await expect(page).not.toHaveURL(/login/i);
  });
});
