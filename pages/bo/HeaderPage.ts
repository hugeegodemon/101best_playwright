import { Page, Locator, expect } from '@playwright/test';
import { BOI18n } from '../../utils/i18n';
import { waitForNetworkSettled, waitForUiSettled } from './CommonPage';

export class BOHeaderPage {
  readonly page: Page;
  readonly root: Locator;
  readonly navbarMenu: Locator;
  readonly navbarToggle: Locator;
  readonly languageSelect: Locator;
  readonly languageTrigger: Locator;
  readonly languageIcon: Locator;
  readonly avatarButton: Locator;
  readonly accountPopover: Locator;
  readonly passwordDialog: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('.header').first();
    this.navbarMenu = page.locator('ul[role="menubar"]').first();
    this.navbarToggle = this.root.locator('.p-4 svg').first();
    this.languageSelect = this.root.locator('.el-select.custom-select.no-border').first();
    this.languageTrigger = this.languageSelect.locator('.el-select__wrapper').first();
    this.languageIcon = this.languageSelect.locator('img').first();
    this.avatarButton = this.root.locator('button.header-info-btn').first();
    this.accountPopover = page.locator('.account-popper').first();
    this.passwordDialog = page.locator('.el-dialog').filter({
      has: page.locator('.el-dialog__body form'),
    }).first();
    this.i18n = new BOI18n(page);
  }

  private async menuLabel(key: string): Promise<Locator> {
    const label = await this.i18n.t(key);
    return this.navbarMenu.locator('span', { hasText: label });
  }

  private languageOptionsPopover(): Locator {
    return this.page.locator('.el-select__popper').filter({
      has: this.page.locator('.lang-select-options'),
    }).first();
  }

  async toggleNavbar() {
    await this.navbarToggle.click();
    await waitForUiSettled(this.page);
  }

  async expectNavbarExpanded() {
    await expect(this.root).toHaveAttribute('style', /left:\s*280px;/i);
    await expect.poll(async () => (await this.menuLabel('admin_management')).count()).toBeGreaterThan(0);
    await expect.poll(async () => {
      const box = await this.navbarMenu.boundingBox();
      return Math.round(box?.width ?? 0);
    }).toBe(248);
  }

  async expectNavbarCollapsed() {
    await expect(this.root).toHaveAttribute('style', /left:\s*72px;/i);
    await expect(await this.menuLabel('admin_management')).toHaveCount(0);
    await expect.poll(async () => {
      const box = await this.navbarMenu.boundingBox();
      return Math.round(box?.width ?? 0);
    }).toBe(64);
    await expect(this.navbarMenu.locator('.el-sub-menu__title svg').first()).toBeVisible();
  }

  async expectLanguageSelectorVisible() {
    await expect(this.languageSelect).toBeVisible();
    await expect(this.languageIcon).toBeVisible();
    await expect(this.languageSelect.locator('.el-select__placeholder')).toContainText(/\S+/);
  }

  async openLanguageMenu() {
    await this.languageTrigger.click();
    await waitForUiSettled(this.page);
  }

  async expectLanguageMenuVisible() {
    const optionsPopover = this.languageOptionsPopover();

    await expect(optionsPopover).toBeVisible();
    await expect.poll(async () => await optionsPopover.locator('[role="option"]').count()).toBeGreaterThan(1);
  }

  async openAccountPopover() {
    await this.avatarButton.click();
    await waitForUiSettled(this.page);
  }

  async expectAccountPopoverVisible() {
    const passwordText = await this.i18n.t('password');
    const signOutText = await this.i18n.t('sign_out');
    const currencyText = await this.i18n.t('currency');
    const lastLoginText = await this.i18n.t('last_login');

    await expect(this.accountPopover).toBeVisible();
    await expect(this.accountPopover).toContainText(passwordText);
    await expect(this.accountPopover).toContainText(signOutText);
    await expect(this.accountPopover).toContainText(currencyText);
    await expect(this.accountPopover).toContainText(lastLoginText);
  }

  async clickAccountAction(key: 'password' | 'sign_out') {
    const actionText = await this.i18n.t(key);
    await this.accountPopover.getByRole('button', { name: actionText }).click();
    await waitForUiSettled(this.page);
  }

  async openPasswordDialog() {
    await this.openAccountPopover();
    await this.expectAccountPopoverVisible();
    await this.clickAccountAction('password');
  }

  async expectPasswordDialogVisible() {
    const titleText = await this.i18n.t('reset_password');
    const passwordText = await this.i18n.t('password');
    const confirmPasswordText = await this.i18n.t('confirm_password');

    await expect(this.passwordDialog).toBeVisible();
    await expect(this.passwordDialog).toContainText(titleText);
    await expect(this.passwordDialog.getByLabel(passwordText, { exact: true })).toBeVisible();
    await expect(this.passwordDialog.getByLabel(confirmPasswordText)).toBeVisible();
  }

  async closePasswordDialog() {
    await this.passwordDialog.locator('.el-dialog__headerbtn').click();
    await expect(this.passwordDialog).toBeHidden();
    await waitForUiSettled(this.page);
  }

  async signOut() {
    await this.openAccountPopover();
    await this.expectAccountPopoverVisible();
    await this.clickAccountAction('sign_out');
    await waitForNetworkSettled(this.page);
  }
}
