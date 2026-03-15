import { test } from './test';
import { BOOperatorRolePage } from '../../../pages/bo/OperatorRolePage';
import { BOI18n } from '../../../utils/i18n';
import { buildRoleName } from '../helpers/data';

test.describe('BO Operator Role', () => {
  test('role permission list page opens', async ({ page }) => {

    const rolePage = new BOOperatorRolePage(page);
    await rolePage.gotoRolePermissionList();
    await rolePage.expectRolePermissionListVisible();
  });

  test('add role dialog can open and cancel', async ({ page }) => {

    const rolePage = new BOOperatorRolePage(page);
    await rolePage.gotoRolePermissionList();
    await rolePage.openAddRoleDialog();
    await rolePage.expectAddRoleDialogVisible();
    await rolePage.cancelRoleDialog();
    await rolePage.expectRoleDialogHidden();
  });

  test('add role requires role status and site', async ({ page }) => {

    const rolePage = new BOOperatorRolePage(page);
    await rolePage.gotoRolePermissionList();
    await rolePage.openAddRoleDialog();
    await rolePage.expectAddRoleDialogVisible();
    await rolePage.saveRoleDialog();
    await rolePage.expectRequiredValidationErrors(3);
  });

  test('add role validates role name format', async ({ page }) => {

    const rolePage = new BOOperatorRolePage(page);
    const i18n = new BOI18n(page);
    await rolePage.gotoRolePermissionList();
    await rolePage.openAddRoleDialog();
    await rolePage.expectAddRoleDialogVisible();
    await rolePage.fillRoleName(' 1');
    await rolePage.saveRoleDialog();

    await rolePage.expectRoleNameErrorContains([
      await i18n.t('role_validate'),
      await i18n.t('000090_30', 'error_code'),
    ]);
  });

  test('can create open edit dialog and change operator role status', async ({ page }) => {
    const rolePage = new BOOperatorRolePage(page);
    const roleName = buildRoleName();
    await rolePage.gotoRolePermissionList();
    await rolePage.expectRolePermissionListVisible();

    await rolePage.createRole({ name: roleName, status: 'Enable' });
    await rolePage.expectSuccessAlert();
    await rolePage.gotoRolePermissionList();
    await rolePage.expectRolePermissionListVisible();
    await rolePage.expectRoleInList(roleName);
    await rolePage.expectRoleStatus(roleName, 'Enable');

    await rolePage.clickEditByRoleName(roleName);
    await rolePage.expectEditRoleDialogVisible();
    await rolePage.cancelRoleDialog();
    await rolePage.expectRoleDialogHidden();

    await rolePage.toggleStatusByRoleName(roleName);
    await rolePage.expectSuccessAlert();
    await rolePage.expectRoleStatus(roleName, 'Disable');
  });
});
