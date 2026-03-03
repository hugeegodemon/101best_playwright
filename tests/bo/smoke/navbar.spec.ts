import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { BOSidebarPage } from '../../../pages/bo/SidebarPage';

test.describe('BO Sidebar Navbar', () => {
  test('main menus are visible', async ({ page }) => {
    const sidebar = new BOSidebarPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await sidebar.expectMenuVisible('Admin');
    await sidebar.expectMenuVisible('Operator');
    await sidebar.expectMenuVisible('Agent');
    await sidebar.expectMenuVisible('Player');
    await sidebar.expectMenuVisible('Finance');
  });

  test('can expand and collapse Operator menu', async ({ page }) => {
    const sidebar = new BOSidebarPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await sidebar.expectMenuCollapsed('Operator');
    await sidebar.expandMenu('Operator');
    await sidebar.expectSubMenuVisible('Operator List');

    await sidebar.collapseMenu('Operator');
    await sidebar.expectMenuCollapsed('Operator');
  });

  test('can navigate to Admin List', async ({ page }) => {
    const sidebar = new BOSidebarPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await sidebar.clickSubMenu('Admin', 'Admin List');

    await expect(page).toHaveURL(/admin/i);
  });

  test('can expand Finance > Deposit and see Deposit Review', async ({ page }) => {
  const sidebar = new BOSidebarPage(page);

  await page.goto(`${ENV.SBO_URL}/dashboard`);

  await sidebar.expandMenu('Finance');
  await sidebar.expectSubMenuVisible('Deposit');

  await sidebar.expandNestedMenu('Finance', 'Deposit');
  await sidebar.expectSubMenuVisible('Deposit Review');
});

  test('can navigate to Finance > Deposit > Deposit Review', async ({ page }) => {
    const sidebar = new BOSidebarPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await sidebar.clickThirdLevelMenu('Finance', 'Deposit', 'Deposit Review');

    await expect(page).toHaveURL(/review/i);
  });
});