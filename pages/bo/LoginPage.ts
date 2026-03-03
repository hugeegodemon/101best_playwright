import { Page, expect } from '@playwright/test';

export class BOLoginPage {
  constructor(private page: Page) {}

  async goto(baseUrl: string) {
    await this.page.goto(baseUrl);
  }
  async login(account: string, password: string) {
    await this.page.getByPlaceholder('Account').fill(account);
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: /login/i }).click();
  }
  async expectLoginError(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }
}