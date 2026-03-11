import { Page, expect } from '@playwright/test';
import { BOI18n } from '../../utils/i18n';

export class BOLoginPage {
  private readonly i18n: BOI18n;

  constructor(private page: Page) {
    this.i18n = new BOI18n(page);
  }

  async goto(baseUrl: string) {
    await this.page.goto(baseUrl, { waitUntil: 'networkidle' });
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
  }

  async expectLoginError(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }
}
