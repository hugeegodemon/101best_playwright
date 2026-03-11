import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOOperatorPage } from '../../../pages/bo/OperatorPage';
import { BOI18n, useLocaleInContext } from '../../../utils/i18n';

test.describe('BO Operator CRUD', () => {
  test('can create edit and search operator account', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const operatorPage = new BOOperatorPage(page);
    const unique = Date.now();
    const operatorAccount = `op${unique}`;
    const operatorName = 'AutoOperator';
    const operatorPassword = 'Test12345';
    const operatorEmail = `operator${unique}@test.com`;

    await test.step('1. Enter Operator List page', async () => {
      await page.goto(`${ENV.SBO_URL}/dashboard`);
      await operatorPage.gotoOperatorList();
      await operatorPage.expectOperatorListVisible();
    });

    await test.step('2. Enter add page and create a new operator account', async () => {
      await operatorPage.clickAddOperator();
      await operatorPage.expectAddOperatorVisible();

      await operatorPage.createOperator({
        account: operatorAccount,
        name: operatorName,
        email: operatorEmail,
        password: operatorPassword,
        status: 'Enable',
      });

      await expect(page).toHaveURL(/\/operator$/);
      await operatorPage.expectAlertContainsAny([/success/i]);
    });

    await test.step('3. Verify the created operator appears in list', async () => {
      await operatorPage.searchByAccount(operatorAccount);
      await operatorPage.expectOperatorInList(operatorAccount);
      await operatorPage.expectOperatorInList(operatorName);
    });

    await test.step('4. Click edit and enter edit page', async () => {
      await operatorPage.gotoOperatorList();
      await operatorPage.searchByAccount(operatorAccount);
      await operatorPage.expectOperatorInList(operatorAccount);
      await operatorPage.clickEditByAccount(operatorAccount);
      await operatorPage.expectEditOperatorVisible();
      await operatorPage.expectAccountFieldDisabled();
      await operatorPage.expectResetPasswordButtonVisible();
    });

    await test.step('5. Change the status of created operator account', async () => {
      await operatorPage.gotoOperatorList();
      await operatorPage.searchByAccount(operatorAccount);
      await operatorPage.openStatusDialogByAccount(operatorAccount);
      await operatorPage.expectStatusDialogVisible('Enable');
      await operatorPage.selectStatusInDialog('Disable');
      await operatorPage.confirmStatusDialog();
      await operatorPage.expectAlertContainsAny([/success/i]);
    });

    await test.step('6. Search again and verify created operator exists in list', async () => {
      await operatorPage.searchByAccount(operatorAccount);
      await operatorPage.expectOperatorInList(operatorAccount);
      await operatorPage.expectOperatorInList('Disable');
    });
  });

  test('reset password validates and updates created operator account', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    const unique = Date.now();
    const operatorAccount = `op${unique}`;
    const operatorPassword = 'Test12345';
    const newPassword = 'Newpass123';

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await operatorPage.gotoAddOperator();
    await operatorPage.createOperator({
      account: operatorAccount,
      name: 'AutoOperator',
      email: `operator${unique}@test.com`,
      password: operatorPassword,
      status: 'Enable',
    });
    await operatorPage.expectAlertContainsAny([/success/i]);
    await page.waitForTimeout(3200);

    await operatorPage.gotoOperatorList();
    await operatorPage.searchByAccount(operatorAccount);
    await operatorPage.clickEditByAccount(operatorAccount);
    await operatorPage.expectEditOperatorVisible();
    await operatorPage.expectResetPasswordButtonVisible();

    await test.step('1. Reset password dialog can open and cancel', async () => {
      await operatorPage.openResetPasswordDialog();
      await operatorPage.expectResetPasswordDialogVisible();
      await operatorPage.cancelResetPassword();
      await operatorPage.expectResetPasswordDialogHidden();
    });

    await test.step('2. Reset password requires both fields', async () => {
      await operatorPage.openResetPasswordDialog();
      await operatorPage.expectResetPasswordDialogVisible();
      await operatorPage.confirmResetPassword();
      await operatorPage.expectResetPasswordRequiredErrors(2);
      await operatorPage.cancelResetPassword();
      await operatorPage.expectResetPasswordDialogHidden();
    });

    await test.step('3. Reset password requires matching confirm password', async () => {
      await operatorPage.openResetPasswordDialog();
      await operatorPage.expectResetPasswordDialogVisible();
      await operatorPage.fillResetPasswordForm({
        password: newPassword,
        confirmPassword: 'Wrongpass123',
      });
      await operatorPage.confirmResetPassword();
      await operatorPage.expectResetPasswordFormErrorContains([
        await i18n.t('need_same_password'),
        await i18n.t('must_match_password'),
        /match/i,
      ]);
      await operatorPage.cancelResetPassword();
      await operatorPage.expectResetPasswordDialogHidden();
    });

    await test.step('4. Reset password validates password format', async () => {
      await operatorPage.openResetPasswordDialog();
      await operatorPage.expectResetPasswordDialogVisible();
      await operatorPage.fillResetPasswordForm({
        password: 'abc123',
        confirmPassword: 'abc123',
      });
      await operatorPage.confirmResetPassword();
      await operatorPage.expectResetPasswordFormErrorContains([/8.*20/i, /alphanumeric/i]);
      await operatorPage.cancelResetPassword();
      await operatorPage.expectResetPasswordDialogHidden();
    });

    await test.step('5. Reset password cannot reuse old password', async () => {
      await operatorPage.openResetPasswordDialog();
      await operatorPage.expectResetPasswordDialogVisible();
      await operatorPage.fillResetPasswordForm({
        password: operatorPassword,
        confirmPassword: operatorPassword,
      });
      await operatorPage.confirmResetPassword();
      await operatorPage.expectAlertContainsAny([
        await i18n.error('000094'),
        await i18n.error('000032'),
        /same as the old password/i,
      ]);
      await operatorPage.expectResetPasswordDialogVisible();
      await operatorPage.cancelResetPassword();
      await operatorPage.expectResetPasswordDialogHidden();
    });

    await test.step('6. Reset password success shows success message', async () => {
      await page.waitForTimeout(3200);
      await operatorPage.openResetPasswordDialog();
      await operatorPage.expectResetPasswordDialogVisible();
      await operatorPage.fillResetPasswordForm({
        password: newPassword,
        confirmPassword: newPassword,
      });
      await operatorPage.confirmResetPassword();
      await operatorPage.expectAlertContainsAny([
        await i18n.t('success'),
        await i18n.t('reset_password_success'),
        await i18n.t('update_success'),
      ]);
      await operatorPage.expectResetPasswordDialogHidden();
    });
  });

});
