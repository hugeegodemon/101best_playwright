import { test, expect } from './test';
import { BOSidebarPage } from '../../../pages/bo/SidebarPage';

test.describe('BO Sidebar Navbar', () => {
  test('main menus are visible', async ({ page }) => {

    const sidebar = new BOSidebarPage(page);

    await sidebar.expectMenuVisible('admin_management');
    await sidebar.expectMenuVisible('operator');
    await sidebar.expectMenuVisible('agent');
    await sidebar.expectMenuVisible('player');
    await sidebar.expectMenuVisible('finance');
  });

  test('can expand and collapse Operator menu', async ({ page }) => {

    const sidebar = new BOSidebarPage(page);

    await sidebar.expectMenuCollapsed('operator');
    await sidebar.expandMenu('operator');
    await sidebar.expectSubMenuVisible('operator_management');

    await sidebar.collapseMenu('operator');
    await sidebar.expectMenuCollapsed('operator');
  });

  test('can navigate to Admin List', async ({ page }) => {

    const sidebar = new BOSidebarPage(page);

    await sidebar.clickSubMenu('admin_management', 'admin_management_list');

    await expect(page).toHaveURL(/admin/i);
  });

  test('can expand Finance > Deposit and see Deposit Review', async ({ page }) => {

    const sidebar = new BOSidebarPage(page);

    await sidebar.expandMenu('finance');
    await sidebar.expectSubMenuVisible('deposit');

    await sidebar.expandNestedMenu('finance', 'deposit');
    await sidebar.expectSubMenuVisible('deposit_audit');
  });

  test('can navigate to Finance > Deposit > Deposit Review', async ({ page }) => {

    const sidebar = new BOSidebarPage(page);

    await sidebar.clickThirdLevelMenu('finance', 'deposit', 'deposit_audit');

    await expect(page).toHaveURL(/review/i);
  });
});
