import { Page, Locator, expect } from '@playwright/test';
import { BOI18n } from '../../utils/i18n';

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
