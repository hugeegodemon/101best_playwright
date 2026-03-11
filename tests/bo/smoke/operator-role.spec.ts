import { test } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOOperatorRolePage } from '../../../pages/bo/OperatorRolePage';
import { BOI18n, useLocaleInContext } from '../../../utils/i18n';

test.describe('BO Operator Role', () => {
  test('role permission list page opens', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const rolePage = new BOOperatorRolePage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await rolePage.gotoRolePermissionList();
    await rolePage.expectRolePermissionListVisible();
  });

  test('add role dialog can open and cancel', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const rolePage = new BOOperatorRolePage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await rolePage.gotoRolePermissionList();
    await rolePage.openAddRoleDialog();
    await rolePage.expectAddRoleDialogVisible();
    await rolePage.cancelRoleDialog();
    await rolePage.expectRoleDialogHidden();
  });

  test('add role requires role status and site', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const rolePage = new BOOperatorRolePage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await rolePage.gotoRolePermissionList();
    await rolePage.openAddRoleDialog();
    await rolePage.expectAddRoleDialogVisible();
    await rolePage.saveRoleDialog();
    await rolePage.expectRequiredValidationErrors(3);
  });

  test('add role validates role name format', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const rolePage = new BOOperatorRolePage(page);
    const i18n = new BOI18n(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await rolePage.gotoRolePermissionList();
    await rolePage.openAddRoleDialog();
    await rolePage.expectAddRoleDialogVisible();
    await rolePage.fillRoleName(' 1');
    await rolePage.saveRoleDialog();

    await rolePage.expectRoleNameErrorContains([
      await i18n.t('role_validate'),
      /1.*20/i,
      /numbers and symbols are not allowed/i,
    ]);
  });

  test('can create open edit dialog and change operator role status', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const rolePage = new BOOperatorRolePage(page);
    const roleName = `AutoRole${Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 5)}`;
    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await rolePage.gotoRolePermissionList();
    await rolePage.expectRolePermissionListVisible();

    await rolePage.createRole({ name: roleName, status: 'Enable' });
    await rolePage.expectAlertContainsAny([/success/i]);

    await page.goto(`${ENV.SBO_URL}/dashboard`);
    await rolePage.gotoRolePermissionList();
    await rolePage.expectRolePermissionListVisible();
    await rolePage.expectRoleInList(roleName);
    await rolePage.expectRoleRowContains(roleName, 'ON');

    await rolePage.clickEditByRoleName(roleName);
    await rolePage.expectEditRoleDialogVisible();
    await rolePage.cancelRoleDialog();
    await rolePage.expectRoleDialogHidden();

    await rolePage.toggleStatusByRoleName(roleName);
    await rolePage.expectAlertContainsAny([/success/i]);
    await rolePage.expectRoleRowContains(roleName, 'OFF');
  });
});
