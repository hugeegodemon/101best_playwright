import { Page } from '@playwright/test';

export class BOLoginPage {
  constructor(private page: Page) {}

  async goto(baseUrl: string) {
    await this.page.goto(baseUrl);
  }
  async login(account: string, password: string) {
    await this.page.getByPlaceholder('Account').fill(account);
    await this.page.getByPlaceholder('Passwor').fill(password);
    await this.page.getByRole('button', { name: /login/i }).click();
  }
}