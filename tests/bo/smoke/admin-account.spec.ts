import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOAdminPage } from '../../../pages/bo/AdminPage';
import { BOOperatorPage } from '../../../pages/bo/OperatorPage';
import { BOI18n, useLocaleInContext } from '../../../utils/i18n';

function buildAdminData(seed: string | number) {
  return {
    account: `auto${seed}`,
    name: 'AutoAdmin',
    password: 'Test12345',
    email: `autoadmin${seed}@test.com`,
  };
}

test.describe('BO Admin Account', () => {
  test('create admin requires all mandatory fields', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await adminPage.gotoAddAdmin();

    await expect(page).toHaveURL(/\/admin\/add$/);

    await adminPage.save();
    await adminPage.expectRequiredValidationErrors(6);
  });

  test('cannot create duplicate admin account', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);

    const unique = Date.now();
    const adminAccount = `auto${unique}`;
    const firstEmail = `autoadmin${unique}@test.com`;
    const secondEmail = `autoadmin-duplicate${unique}@test.com`;

    await page.goto(`${ENV.SBO_URL}/dashboard`);

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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    const unique = Date.now();
    const sharedAccount = `op${unique}`;

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await operatorPage.gotoAddOperator();
    await operatorPage.createOperator({
      account: sharedAccount,
      name: 'AutoOperator',
      email: `operator${unique}@test.com`,
      password: 'Test12345',
      status: 'Enable',
    });
    await operatorPage.expectAlertContainsAny([/success/i]);
    await page.waitForTimeout(3200);

    await adminPage.gotoAddAdmin();
    await adminPage.createAdmin({
      account: sharedAccount,
      name: 'AutoAdmin',
      password: 'Test12345',
      email: `admin-cross-${unique}@test.com`,
      status: 'Enable',
    });

    await expect(page.locator('body')).toContainText(await i18n.error('000155'));
  });

  test('create admin requires matching confirm password', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);

    const unique = Date.now();
    const adminAccount = `auto${unique}`;
    const adminEmail = `autoadmin${unique}@test.com`;

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await adminPage.gotoAddAdmin();
    await adminPage.fillCreateAdminForm({
      account: adminAccount,
      name: 'AutoAdmin',
      password: 'Test12345',
      confirmPassword: 'Test54321',
      email: adminEmail,
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await adminPage.gotoAddAdmin();
    await adminPage.fillCreateAdminForm({
      account: 'a123',
      name: 'AutoAdmin',
      password: 'Test12345',
      email: `invalid-account-${Date.now()}@test.com`,
      status: 'Enable',
    });
    await adminPage.save();

    await adminPage.expectFieldErrorContains('account', [/5.*20.*alphanumeric/i, /5.*20/i]);
  });

  test('create admin validates name format', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await adminPage.gotoAddAdmin();
    await adminPage.fillCreateAdminForm({
      account: `auto${Date.now()}`,
      name: ' Admin1',
      password: 'Test12345',
      email: `invalid-name-${Date.now()}@test.com`,
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await adminPage.gotoAddAdmin();
    await adminPage.fillCreateAdminForm({
      account: `auto${Date.now()}`,
      name: 'AutoAdmin',
      password: 'Test12345',
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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
    await adminPage.expectNoAdminData();
  });

  test('edit admin keeps account disabled and shows reset password action', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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

    await adminPage.expectFieldErrorContains('name', [/required/i]);
    await adminPage.expectFieldErrorContains('e_mail', [/required/i]);
  });

  test('edit admin validates email format', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData(Date.now());

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const adminPage = new BOAdminPage(page);
    const i18n = new BOI18n(page);
    const data = buildAdminData(Date.now());
    const newPassword = 'Newpass123';

    await page.goto(`${ENV.SBO_URL}/dashboard`);
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

    await adminPage.expectAlertContainsAny([
      await i18n.t('success'),
      await i18n.t('reset_password_success'),
      await i18n.t('update_success'),
    ]);
    await adminPage.expectResetPasswordDialogHidden();
  });

});
