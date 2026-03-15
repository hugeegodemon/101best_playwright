import { test, expect } from './test';
import { BOOperatorPage } from '../../../pages/bo/OperatorPage';
import { BOI18n } from '../../../utils/i18n';
import { buildOperatorData } from '../helpers/data';

test.describe('BO Operator CRUD', () => {
  test('can create edit and search operator account', async ({ page }) => {
    const operatorPage = new BOOperatorPage(page);
    const operator = buildOperatorData();

    await test.step('1. Enter Operator List page', async () => {
      await operatorPage.gotoOperatorList();
      await operatorPage.expectOperatorListVisible();
    });

    await test.step('2. Enter add page and create a new operator account', async () => {
      await operatorPage.clickAddOperator();
      await operatorPage.expectAddOperatorVisible();

      await operatorPage.createOperator({
        ...operator,
        status: 'Enable',
      });

      await expect(page).toHaveURL(/\/operator$/);
      await operatorPage.expectCreateSuccessAlert();
    });

    await test.step('3. Verify the created operator appears in list', async () => {
      await operatorPage.searchByAccount(operator.account);
      await operatorPage.expectOperatorInList(operator.account);
      await operatorPage.expectOperatorInList(operator.name);
    });

    await test.step('4. Click edit and enter edit page', async () => {
      await operatorPage.gotoOperatorList();
      await operatorPage.searchByAccount(operator.account);
      await operatorPage.expectOperatorInList(operator.account);
      await operatorPage.clickEditByAccount(operator.account);
      await operatorPage.expectEditOperatorVisible();
      await operatorPage.expectAccountFieldDisabled();
      await operatorPage.expectResetPasswordButtonVisible();
    });

    await test.step('5. Change the status of created operator account', async () => {
      await operatorPage.gotoOperatorList();
      await operatorPage.searchByAccount(operator.account);
      await operatorPage.openStatusDialogByAccount(operator.account);
      await operatorPage.expectStatusDialogVisible('Enable');
      await operatorPage.selectStatusInDialog('Disable');
      await operatorPage.confirmStatusDialog();
      await operatorPage.expectUpdateSuccessAlert();
    });

    await test.step('6. Search again and verify created operator exists in list', async () => {
      await operatorPage.searchByAccount(operator.account);
      await operatorPage.expectOperatorInList(operator.account);
      await operatorPage.expectStatusInList(operator.account, 'Disable');
    });
  });

  test('reset password validates and updates created operator account', async ({ page }) => {
    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    const operator = buildOperatorData();
    const newPassword = 'Newpass123';

    await operatorPage.gotoAddOperator();
    await operatorPage.createOperator({
      ...operator,
      status: 'Enable',
    });
    await operatorPage.expectCreateSuccessAlert();
    await page.waitForTimeout(3200);

    await operatorPage.gotoOperatorList();
    await operatorPage.searchByAccount(operator.account);
    await operatorPage.clickEditByAccount(operator.account);
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
        await i18n.t('000097_16', 'error_code'),
        await i18n.t('000011_12', 'error_code'),
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
      await operatorPage.expectResetPasswordFormErrorContains([
        await i18n.t('password_validate'),
        await i18n.t('password_validate_2'),
        await i18n.t('000113_5', 'error_code'),
        await i18n.t('000097_15', 'error_code'),
      ]);
      await operatorPage.cancelResetPassword();
      await operatorPage.expectResetPasswordDialogHidden();
    });

    await test.step('5. Reset password cannot reuse old password', async () => {
      await operatorPage.openResetPasswordDialog();
      await operatorPage.expectResetPasswordDialogVisible();
      await operatorPage.fillResetPasswordForm({
        password: operator.password,
        confirmPassword: operator.password,
      });
      await operatorPage.confirmResetPassword();
      await operatorPage.expectAlertContainsAny([
        await i18n.error('000094'),
        await i18n.error('000032'),
        await i18n.error('000044_9'),
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
      await operatorPage.expectResetPasswordSuccessAlert();
      await operatorPage.expectResetPasswordDialogHidden();
    });
  });

});
