import { Page, Locator, expect } from '@playwright/test';

export class BOCommonPage {
  readonly page: Page;
  readonly userMenuButton: Locator;
  readonly signOutButton: Locator;
  readonly accountInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenuButton = page.locator('button:has(.user-wrap)').first();
    this.signOutButton = page.getByRole('button', { name: /sign out/i });
    this.accountInput = page.getByPlaceholder('Account');
  }

  async openUserMenu() {
    await this.page.waitForLoadState('networkidle');
    await this.userMenuButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.userMenuButton.click();
  }

  async clickSignOut() {
    await this.signOutButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.signOutButton.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.clickSignOut();
  }

  async expectLoginPageVisible() {
    await expect(this.accountInput).toBeVisible();
  }
}