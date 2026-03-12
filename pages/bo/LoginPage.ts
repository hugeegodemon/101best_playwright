import { Page, expect } from '@playwright/test';
import { BOI18n } from '../../utils/i18n';

export class BOLoginPage {
  private readonly i18n: BOI18n;

  constructor(private page: Page) {
    this.i18n = new BOI18n(page);
  }

  async goto(baseUrl: string) {
    await this.page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  }

  async login(account: string, password: string) {
    const accountText = await this.i18n.t('account');
    const passwordText = await this.i18n.t('password');
    const loginText = await this.i18n.t('login');
    const formInputs = this.page.locator('form input.el-input__inner');

    await this.page.getByRole('button', { name: loginText }).waitFor({ state: 'visible' });

    try {
      await this.page.getByPlaceholder(accountText).fill(account);
      await this.page.getByPlaceholder(passwordText).fill(password);
    } catch {
      await formInputs.nth(0).fill(account);
      await formInputs.nth(1).fill(password);
    }

    await this.page.getByRole('button', { name: loginText }).click();
    await this.confirmConcurrentSessionIfNeeded();
  }

  async expectDashboardVisible() {
    await expect(this.page).toHaveURL(/dashboard/i, { timeout: 20000 });
    await expect(this.page.getByText(await this.i18n.t('system_management'), { exact: true })).toBeVisible({
      timeout: 20000,
    });
  }

  async expectLoginError(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }

  private async confirmConcurrentSessionIfNeeded() {
    const sessionDialog = this.page.locator('.el-message-box').filter({ hasText: /another session/i }).first();

    try {
      await sessionDialog.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      return;
    }

    await sessionDialog.getByRole('button').last().click();
  }
}
