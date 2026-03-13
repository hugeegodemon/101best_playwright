import { test } from './test';
import { BOHeaderPage } from '../../../pages/bo/HeaderPage';
import { BOCommonPage } from '../../../pages/bo/CommonPage';

test.describe('BO Header', () => {
  test('can collapse and expand navbar', async ({ page }) => {

    const header = new BOHeaderPage(page);

    await header.expectNavbarExpanded();

    await header.toggleNavbar();
    await header.expectNavbarCollapsed();

    await header.toggleNavbar();
    await header.expectNavbarExpanded();
  });

  test('language selector shows current language and opens options menu', async ({ page }) => {

    const header = new BOHeaderPage(page);

    await header.expectLanguageSelectorVisible();
    await header.openLanguageMenu();
    await header.expectLanguageMenuVisible();
  });

  test('account avatar opens popper with account actions', async ({ page }) => {

    const header = new BOHeaderPage(page);

    await header.openAccountPopover();
    await header.expectAccountPopoverVisible();
  });

  test('password action opens reset password dialog', async ({ page }) => {

    const header = new BOHeaderPage(page);

    await header.openPasswordDialog();
    await header.expectPasswordDialogVisible();
    await header.closePasswordDialog();
  });

  test('sign out action returns user to login page @isolated-session', async ({ page }) => {

    const header = new BOHeaderPage(page);
    const commonPage = new BOCommonPage(page);

    await header.signOut();
    await commonPage.expectLoginPageVisible();
  });
});
