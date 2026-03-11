import { test } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';
import { BOHeaderPage } from '../../../pages/bo/HeaderPage';
import { BOCommonPage } from '../../../pages/bo/CommonPage';

test.describe('BO Header', () => {
  test('can collapse and expand navbar', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const header = new BOHeaderPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await header.expectNavbarExpanded();

    await header.toggleNavbar();
    await header.expectNavbarCollapsed();

    await header.toggleNavbar();
    await header.expectNavbarExpanded();
  });

  test('language selector shows current language and opens options menu', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const header = new BOHeaderPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await header.expectLanguageSelectorVisible();
    await header.openLanguageMenu();
    await header.expectLanguageMenuVisible();
  });

  test('account avatar opens popper with account actions', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const header = new BOHeaderPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await header.openAccountPopover();
    await header.expectAccountPopoverVisible();
  });

  test('password action opens reset password dialog', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const header = new BOHeaderPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await header.openPasswordDialog();
    await header.expectPasswordDialogVisible();
    await header.closePasswordDialog();
  });

  test('sign out action returns user to login page', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const header = new BOHeaderPage(page);
    const commonPage = new BOCommonPage(page);

    await page.goto(`${ENV.SBO_URL}/dashboard`);

    await header.signOut();
    await commonPage.expectLoginPageVisible();
  });
});
