import { test, expect } from './test';
import { BOAdminPage } from '../../../pages/bo/AdminPage';
import { BOOperatorPage } from '../../../pages/bo/OperatorPage';
import { BOI18n } from '../../../utils/i18n';
import { buildAdminData, uniqueSeed } from '../helpers/data';

test.describe('BO Admin Account', () => {
  test('create admin requires all mandatory fields', async ({ page }) => {

    const adminPage = new BOAdminPage(page);
    await adminPage.gotoAddAdmin();

    await expect(page).toHaveURL(/\/admin\/add$/);

    await adminPage.save();
    await adminPage.expectRequiredValidationErrors(6);
  });

  test('cannot create duplicate admin account', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const seed = uniqueSeed();
    const adminAccount = `auto${seed}`;
    const firstEmail = `autoadmin${seed}@test.com`;
    const secondEmail = `autoadmin-duplicate${seed}@test.com`;

    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      account: adminAccount,
      name: 'AutoAdmin',
      password: 'Test12345',
      email: firstEmail,
      status: 'Enable',
    });
    await page.waitForTimeout(3200);

    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      account: adminAccount,
      name: 'AutoAdmin',
      password: 'Test12345',
      email: secondEmail,
      status: 'Enable',
    });

    await expect(page.locator('body')).toContainText(await i18n.error('000063'));
  });

  test('cannot create admin account with existing operator account', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    const seed = uniqueSeed();
    const sharedAccount = `op${seed}`;

    await operatorPage.gotoAddOperator();
    await operatorPage.createOperator({
      account: sharedAccount,
      name: 'AutoOperator',
      email: `operator${seed}@test.com`,
      password: 'Test12345',
      status: 'Enable',
    });
    await operatorPage.expectCreateSuccessAlert();
    await page.waitForTimeout(3200);

    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      account: sharedAccount,
      name: 'AutoAdmin',
      password: 'Test12345',
      email: `admin-cross-${seed}@test.com`,
      status: 'Enable',
    });

    await expect(page.locator('body')).toContainText(await i18n.error('000155'));
  });

  test('create admin requires matching confirm password', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData();

    await adminPage.gotoAddAdmin();
    await adminPage.fillCreateAdminForm({
      account: data.account,
      name: data.name,
      password: data.password,
      confirmPassword: 'Test54321',
      email: data.email,
      status: 'Enable',
    });
    await adminPage.save();

    await adminPage.expectAnyFormErrorContains([
      await i18n.t('need_same_password'),
      await i18n.t('must_match_password'),
      await i18n.error('000090_21'),
      await i18n.error('000011_12'),
    ]);
  });

  test('create admin validates account format', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    await adminPage.gotoAddAdmin();
    await adminPage.fillCreateAdminForm({
      account: 'a123',
      name: 'AutoAdmin',
      password: 'Test12345',
      email: `invalid-account-${uniqueSeed()}@test.com`,
      status: 'Enable',
    });
    await adminPage.save();

    await adminPage.expectFieldErrorContains('account', [/5.*20.*alphanumeric/i, /5.*20/i]);
  });

  test('create admin validates name format', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData();

    await adminPage.gotoAddAdmin();
    await adminPage.fillCreateAdminForm({
      account: data.account,
      name: ' Admin1',
      password: data.password,
      email: `invalid-name-${uniqueSeed()}@test.com`,
      status: 'Enable',
    });
    await adminPage.save();

    await adminPage.expectFieldErrorContains('name', [
      await i18n.t('no_spaces_allowed'),
      /2.*20/i,
      /space/i,
    ]);
  });

  test('create admin validates email format', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData();

    await adminPage.gotoAddAdmin();
    await adminPage.fillCreateAdminForm({
      account: data.account,
      name: data.name,
      password: data.password,
      email: 'invalid-email',
      status: 'Enable',
    });
    await adminPage.save();

    await adminPage.expectFieldErrorContains('e_mail', [
      await i18n.t('email_validate'),
      await i18n.error('000090_23'),
      /email/i,
    ]);
  });

  test('admin list can search by account and reset filters', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const data = buildAdminData();
    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      ...data,
      status: 'Enable',
    });
    await page.waitForTimeout(3200);

    await adminPage.gotoAdminList();
    await adminPage.searchAdmin(data.account);
    await adminPage.expectAdminInList(data.account);

    await adminPage.clickReset();
    await adminPage.clickSearch();
    await adminPage.expectKeywordCleared();
  });

  test('edit admin keeps account disabled and shows reset password action', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const data = buildAdminData();
    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      ...data,
      status: 'Enable',
    });
    await page.waitForTimeout(3200);

    await adminPage.gotoEditByAccount(data.account);
    await expect(page).toHaveURL(/\/admin\/edit\?id=\d+$/);
    await adminPage.expectAccountFieldDisabled();
    await adminPage.expectResetPasswordButtonVisible();
  });

  test('edit admin requires name and email', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData();
    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      ...data,
      status: 'Enable',
    });
    await page.waitForTimeout(3200);

    await adminPage.gotoEditByAccount(data.account);
    await adminPage.clearEditField('name');
    await adminPage.clearEditField('e_mail');
    await adminPage.save();

    await adminPage.expectFieldErrorContains('name', [await i18n.t('required_field'), /required/i]);
    await adminPage.expectFieldErrorContains('e_mail', [await i18n.t('required_field'), /required/i]);
  });

  test('edit admin validates email format', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData();
    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      ...data,
      status: 'Enable',
    });
    await page.waitForTimeout(3200);

    await adminPage.gotoEditByAccount(data.account);
    await adminPage.fillEditAdminForm({ email: 'invalid-email' });
    await adminPage.save();

    await adminPage.expectFieldErrorContains('e_mail', [
      await i18n.t('email_validate'),
      await i18n.error('000090_23'),
      /email/i,
    ]);
  });

  test('reset password dialog can cancel without saving', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const data = buildAdminData();
    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      ...data,
      status: 'Enable',
    });
    await page.waitForTimeout(3200);

    await adminPage.gotoEditByAccount(data.account);
    await adminPage.openResetPasswordDialog();
    await adminPage.expectResetPasswordDialogVisible();
    await adminPage.cancelResetPassword();
    await adminPage.expectResetPasswordDialogHidden();
  });

  test('reset password requires both password fields', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const data = buildAdminData();
    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      ...data,
      status: 'Enable',
    });
    await page.waitForTimeout(3200);

    await adminPage.gotoEditByAccount(data.account);
    await adminPage.openResetPasswordDialog();
    await adminPage.expectResetPasswordDialogVisible();
    await adminPage.confirmResetPassword();

    await adminPage.expectResetPasswordRequiredErrors(2);
  });

  test('reset password requires matching confirm password', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData();
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
      password: 'Newpass123',
      confirmPassword: 'Wrongpass123',
    });
    await adminPage.confirmResetPassword();

    await adminPage.expectResetPasswordFormErrorContains([
      await i18n.t('need_same_password'),
      await i18n.t('must_match_password'),
      /match/i,
    ]);
  });

  test('reset password validates password format', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const data = buildAdminData();
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
      password: 'abc123',
      confirmPassword: 'abc123',
    });
    await adminPage.confirmResetPassword();

    await adminPage.expectResetPasswordFormErrorContains([/8.*20/i, /alphanumeric/i]);
  });

  test('reset password cannot reuse old password', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData();
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
      password: data.password,
      confirmPassword: data.password,
    });
    await adminPage.confirmResetPassword();
    await adminPage.expectAlertContainsAny([
      await i18n.error('000094'),
      await i18n.error('000032'),
      /same as the old password/i,
    ]);
  });

  test('reset password success shows success message', async ({ page }) => {
    const adminPage = new BOAdminPage(page);
    const data = buildAdminData();
    const newPassword = 'Newpass123';
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
  });

});
