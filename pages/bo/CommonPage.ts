import { Page, Locator, expect } from '@playwright/test';
import { BOI18n } from '../../utils/i18n';

export async function waitForUiSettled(page: Page, delay = 300) {
  await page.waitForTimeout(delay);
}

export async function waitForNetworkSettled(page: Page, delay = 500) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await waitForUiSettled(page, delay);
}

export async function waitForVisibleSelectOptions(page: Page) {
  await expect(page.locator('.el-select-dropdown:visible .el-select-dropdown__item').first()).toBeVisible();
}

export async function waitForAlertOrIdle(page: Page, timeout = 800) {
  const alerts = page.locator('.el-message, [role="alert"]');

  await Promise.race([
    alerts.first().waitFor({ state: 'visible', timeout }).catch(() => undefined),
    page.waitForTimeout(timeout),
  ]);
}

export class BOCommonPage {
  readonly page: Page;
  readonly userMenuButton: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.userMenuButton = page.locator('button:has(.user-wrap)').first();
    this.i18n = new BOI18n(page);
  }

  async openUserMenu() {
    await this.page.waitForLoadState('networkidle');
    await this.userMenuButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.userMenuButton.click();
  }

  async clickSignOut() {
    const signOutText = await this.i18n.t('sign_out');
    const signOutButton = this.page.getByRole('button', { name: signOutText });

    await signOutButton.waitFor({ state: 'visible', timeout: 10000 });
    await signOutButton.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.clickSignOut();
  }

  async expectLoginPageVisible() {
    const accountText = await this.i18n.t('account');
    await expect(this.page.getByPlaceholder(accountText)).toBeVisible();
  }
}
