import { Page, Locator, expect } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';

type AdminStatus = 'Enable' | 'Disable';
type SearchType = 'Account' | 'Name';
type StatusFilter = 'All Statuses' | AdminStatus;

export class BOAdminPage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  readonly addButton: Locator;
  readonly table: Locator;
  readonly keywordInput: Locator;
  readonly resetButton: Locator;
  readonly searchButton: Locator;
  readonly saveButton: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.i18n = new BOI18n(page);

    const filterBox = page.locator('.page-box').nth(0);
    const listBox = page.locator('.page-box').nth(1);
    const filterForm = filterBox.locator('form.page-filter-form');
    const formActionArea = filterForm.locator('.el-form-item').last();
    const formActionBox = page.locator('.center-btn').first();

    this.addButton = listBox.locator('button.btn-blue').first();
    this.table = listBox.locator('table.el-table__body').first();
    this.keywordInput = filterForm.locator('input.el-input__inner').first();
    this.resetButton = formActionArea.locator('button.btn-default').first();
    this.searchButton = formActionArea.locator('button.btn-primary').first();
    this.saveButton = formActionBox.locator('button.btn-primary').first();
  }

  private async text(key: string): Promise<string> {
    return this.i18n.t(key);
  }

  private async statusText(status: AdminStatus): Promise<string> {
    return this.text(status === 'Enable' ? 'basic_status_1' : 'basic_status_0');
  }

  private async searchTypeText(type: SearchType): Promise<string> {
    return this.text(type === 'Account' ? 'account' : 'name');
  }

  private async statusFilterText(status: StatusFilter): Promise<string> {
    if (status === 'All Statuses') {
      return this.text('all_status');
    }

    return this.statusText(status);
  }

  private async searchTypeSelect(): Promise<Locator> {
    const accountText = await this.text('account');

    return this.page
      .locator('.page-box')
      .nth(0)
      .locator('form.page-filter-form')
      .locator('.el-form-item')
      .filter({ has: this.page.getByText(accountText, { exact: true }) })
      .locator('.el-select__wrapper')
      .first();
  }

  private async statusFilterSelect(): Promise<Locator> {
    const allStatusesText = await this.text('all_status');

    return this.page
      .locator('.page-box')
      .nth(0)
      .locator('form.page-filter-form')
      .locator('.el-form-item')
      .filter({ has: this.page.getByText(allStatusesText, { exact: true }) })
      .locator('.el-select__wrapper')
      .first();
  }

  private async accountInput(): Promise<Locator> {
    return this.page.getByLabel(await this.text('account'));
  }

  private async nameInput(): Promise<Locator> {
    return this.page.getByLabel(await this.text('name'));
  }

  private async passwordInput(): Promise<Locator> {
    return this.page.getByLabel(await this.text('password'), { exact: true });
  }

  private async confirmPasswordInput(): Promise<Locator> {
    return this.page.getByLabel(await this.text('confirm_password'));
  }

  private async emailInput(): Promise<Locator> {
    return this.page.getByLabel(await this.text('e_mail'));
  }

  private async createStatusSelect(): Promise<Locator> {
    const statusText = await this.text('state');

    return this.page
      .locator('.el-form-item')
      .filter({ has: this.page.getByText(statusText, { exact: true }) })
      .locator('.el-select__wrapper')
      .first();
  }

  async gotoAdminList() {
    await this.sidebar.clickSubMenu('admin_management', 'admin_management_list');
  }

  async clickAddAdmin() {
    await this.addButton.click();
  }

  async selectCreateStatus(status: AdminStatus) {
    const optionText = await this.statusText(status);

    await (await this.createStatusSelect()).click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async fillCreateAdminForm(data: {
    account: string;
    name: string;
    password: string;
    email: string;
    status: AdminStatus;
  }) {
    await (await this.accountInput()).fill(data.account);
    await (await this.nameInput()).fill(data.name);
    await (await this.passwordInput()).fill(data.password);
    await (await this.confirmPasswordInput()).fill(data.password);
    await (await this.emailInput()).fill(data.email);
    await this.selectCreateStatus(data.status);
  }

  async save() {
    await this.saveButton.click();
  }

  async createAdmin(data: {
    account: string;
    name: string;
    password: string;
    email: string;
    status: AdminStatus;
  }) {
    await this.fillCreateAdminForm(data);
    await this.save();
  }

  async selectSearchType(type: SearchType) {
    const optionText = await this.searchTypeText(type);

    await (await this.searchTypeSelect()).click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async fillKeyword(keyword: string) {
    await this.keywordInput.fill(keyword);
  }

  async selectStatusFilter(status: StatusFilter) {
    const optionText = await this.statusFilterText(status);

    await (await this.statusFilterSelect()).click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async clickSearch() {
    await this.searchButton.click();
  }

  async searchAdmin(account: string) {
    await this.selectSearchType('Account');
    await this.fillKeyword(account);
    await this.clickSearch();
  }

  async searchAdminByName(name: string) {
    await this.selectSearchType('Name');
    await this.fillKeyword(name);
    await this.clickSearch();
  }

  async searchAdminWithStatus(account: string, status: StatusFilter) {
    await this.selectSearchType('Account');
    await this.fillKeyword(account);
    await this.selectStatusFilter(status);
    await this.clickSearch();
  }

  async expectAdminInList(account: string) {
    await expect(this.table).toContainText(account);
  }

  rowByAccount(account: string): Locator {
    return this.page.locator('tr.el-table__row').filter({
      has: this.page.locator('td .cell', { hasText: account }),
    }).first();
  }

  async clickEditByAccount(account: string) {
    const row = this.rowByAccount(account);
    await row.locator('div.bg-mainBlue').first().click();
  }

  async changeStatus(status: AdminStatus) {
    await this.selectCreateStatus(status);
    await this.save();
  }

  async expectStatusInList(account: string, status: AdminStatus) {
    const row = this.rowByAccount(account);
    const statusSwitch = row.getByRole('switch');

    if (status === 'Enable') {
      await expect(statusSwitch).toHaveAttribute('aria-checked', 'true');
    } else {
      await expect(statusSwitch).toHaveAttribute('aria-checked', 'false');
    }
  }

  async expectStatusSwitch(account: string, enabled: boolean) {
    const row = this.rowByAccount(account);
    const statusSwitch = row.getByRole('switch');

    await expect(statusSwitch).toHaveAttribute('aria-checked', enabled ? 'true' : 'false');
  }

  async expectLastLoginUpdated(account: string) {
    const row = this.rowByAccount(account);
    const lastLoginCell = row.locator('td').nth(2);

    await expect(lastLoginCell).not.toHaveText('-');
  }

  async expectLastLoginIpUpdated(account: string) {
    const row = this.rowByAccount(account);
    const lastLoginIpCell = row.locator('td').nth(3);

    await expect(lastLoginIpCell).not.toHaveText('-');
  }
}
