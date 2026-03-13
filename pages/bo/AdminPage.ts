import { Page, Locator, expect } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';
import { waitForNetworkSettled, waitForUiSettled, waitForVisibleSelectOptions } from './CommonPage';

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
  readonly resetPasswordDialog: Locator;
  readonly resetPasswordFooter: Locator;
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
    this.resetPasswordDialog = page.locator('.el-dialog').filter({
      has: page.locator('.el-dialog__body form'),
    }).last();
    this.resetPasswordFooter = this.resetPasswordDialog.locator('.el-dialog__footer, [role="contentinfo"]').last();
  }

  private async text(key: string): Promise<string> {
    return this.i18n.t(key);
  }

  private async statusText(status: AdminStatus): Promise<string> {
    return this.text(status === 'Enable' ? 'basic_status_1' : 'basic_status_0');
  }

  private async formStatusTexts(status: AdminStatus): Promise<string[]> {
    const keys =
      status === 'Enable'
        ? ['simple_status_1', 'basic_status_1', 'status_1', 'enable']
        : ['simple_status_0', 'basic_status_0', 'status_0'];

    const values = await Promise.all(keys.map((key) => this.text(key)));
    return [...new Set(values.filter(Boolean))];
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

  private formErrors(): Locator {
    return this.page.locator('.el-form-item__error');
  }

  private async createStatusSelect(): Promise<Locator> {
    const statusText = await this.text('state');

    return this.page
      .locator('.el-form-item')
      .filter({ has: this.page.getByText(statusText, { exact: true }) })
      .locator('.el-select__wrapper')
      .first();
  }

  private async fieldError(key: string): Promise<Locator> {
    const labelText = await this.text(key);

    return this.page
      .locator('.el-form-item')
      .filter({ has: this.page.getByText(labelText, { exact: true }) })
      .locator('.el-form-item__error')
      .first();
  }

  private async resetPasswordInput(): Promise<Locator> {
    return this.resetPasswordDialog.getByLabel(await this.text('password'), { exact: true });
  }

  private async resetConfirmPasswordInput(): Promise<Locator> {
    return this.resetPasswordDialog.getByLabel(await this.text('confirm_password'));
  }

  private async resetPasswordButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: await this.text('reset_password'), exact: true }).first();
  }

  private visibleOptionByName(name: string): Locator {
    return this.page
      .locator('.el-select-dropdown__item')
      .filter({ hasText: name })
      .last();
  }

  private visibleOptions(): Locator {
    return this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item');
  }

  private async waitForListToSettle() {
    await waitForNetworkSettled(this.page, 800);
  }

  private async selectVisibleStatusOption(status: AdminStatus) {
    const options = this.visibleOptions();
    const optionTexts = await this.formStatusTexts(status);

    await expect(options.first()).toBeVisible();

    for (const optionText of optionTexts) {
      const optionByText = options.filter({ hasText: optionText }).first();
      if (await optionByText.count()) {
        await optionByText.click({ force: true });
        return;
      }
    }

    const fallbackIndex = status === 'Enable' ? 0 : 1;
    await options.nth(fallbackIndex).click({ force: true });
  }

  async gotoAdminList() {
    await this.sidebar.clickSubMenu('admin_management', 'admin_management_list');
  }

  async clickAddAdmin() {
    await this.addButton.click();
    await this.waitForListToSettle();
  }

  async gotoAddAdmin() {
    await this.gotoAdminList();
    await this.clickAddAdmin();
  }

  async selectCreateStatus(status: AdminStatus) {
    await (await this.createStatusSelect()).click();
    await this.selectVisibleStatusOption(status);
  }

  async fillCreateAdminForm(data: {
    account: string;
    name: string;
    password: string;
    email: string;
    confirmPassword?: string;
    status?: AdminStatus;
  }) {
    await (await this.accountInput()).fill(data.account);
    await (await this.nameInput()).fill(data.name);
    await (await this.passwordInput()).fill(data.password);
    await (await this.confirmPasswordInput()).fill(data.confirmPassword ?? data.password);
    await (await this.emailInput()).fill(data.email);

    if (data.status !== undefined) {
      await this.selectCreateStatus(data.status);
    }
  }

  async fillEditAdminForm(data: {
    name?: string;
    email?: string;
    status?: AdminStatus;
  }) {
    if (data.name !== undefined) {
      await (await this.nameInput()).fill(data.name);
    }

    if (data.email !== undefined) {
      await (await this.emailInput()).fill(data.email);
    }

    if (data.status !== undefined) {
      await this.selectCreateStatus(data.status);
    }
  }

  async save() {
    await this.page.locator('.center-btn button.btn-primary').last().click({ force: true });
    await this.waitForListToSettle();
  }

  async createAdmin(data: {
    account: string;
    name: string;
    password: string;
    email: string;
    confirmPassword?: string;
    status?: AdminStatus;
  }) {
    await this.fillCreateAdminForm(data);
    await this.save();
  }

  async selectSearchType(type: SearchType) {
    const optionText = await this.searchTypeText(type);

    await (await this.searchTypeSelect()).click();
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOptionByName(optionText).waitFor({ state: 'visible' });
    await this.visibleOptionByName(optionText).click({ force: true });
    await waitForUiSettled(this.page);
  }

  async fillKeyword(keyword: string) {
    await this.keywordInput.fill(keyword);
  }

  async selectStatusFilter(status: StatusFilter) {
    const optionText = await this.statusFilterText(status);

    await (await this.statusFilterSelect()).click();
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOptionByName(optionText).waitFor({ state: 'visible' });
    await this.visibleOptionByName(optionText).click({ force: true });
    await waitForUiSettled(this.page);
  }

  async clickSearch() {
    await this.page
      .locator('.page-box')
      .first()
      .locator('form.page-filter-form .el-form-item')
      .last()
      .locator('button')
      .last()
      .click({ force: true });
    await this.waitForListToSettle();
  }

  async clickReset() {
    await this.page
      .locator('.page-box')
      .first()
      .locator('form.page-filter-form .el-form-item')
      .last()
      .locator('button')
      .first()
      .click({ force: true });
    await this.waitForListToSettle();
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

  async expectNoAdminData() {
    await expect(this.page.getByText(await this.text('no_data'), { exact: true })).toBeVisible();
  }

  async expectKeywordCleared() {
    await expect(this.keywordInput).toHaveValue('');
  }

  async expectRowContainsText(account: string, text: string) {
    await expect(this.rowByAccount(account)).toContainText(text);
  }

  rowByAccount(account: string): Locator {
    return this.page.locator('tr.el-table__row').filter({
      has: this.page.locator('td .cell', { hasText: account }),
    }).first();
  }

  async clickEditByAccount(account: string) {
    const row = this.rowByAccount(account);
    await row.locator('div.bg-mainBlue').first().click();
    await this.waitForListToSettle();
  }

  async gotoEditByAccount(account: string) {
    await this.gotoAdminList();
    await this.searchAdmin(account);
    await this.clickEditByAccount(account);
  }

  async changeStatus(status: AdminStatus) {
    await this.selectCreateStatus(status);
    await this.save();
  }

  async updateAdmin(data: {
    name?: string;
    email?: string;
    status?: AdminStatus;
  }) {
    await this.fillEditAdminForm(data);
    await this.save();
  }

  async expectRequiredValidationErrors(count: number) {
    const requiredText = await this.text('required_field');

    await expect(this.formErrors()).toHaveCount(count);
    await expect(this.formErrors()).toHaveText(Array(count).fill(requiredText));
  }

  async expectAlertContainsAny(messages: Array<string | RegExp>) {
    const alerts = this.page.locator('.el-message, [role="alert"]');
    await expect(alerts.first()).toBeVisible();

    const actualTexts = ((await alerts.allTextContents()) ?? []).map((text) => text.trim());
    expect(
      messages.some((message) =>
        actualTexts.some((text) =>
          typeof message === 'string' ? text.includes(message) : message.test(text)
        )
      )
    ).toBeTruthy();
  }

  async expectAnyFormErrorContains(messages: Array<string | RegExp>) {
    await expect(this.formErrors().first()).toBeVisible();

    const actualTexts = ((await this.formErrors().allTextContents()) ?? []).map((text) => text.trim());
    expect(
      messages.some((message) =>
        actualTexts.some((text) =>
          typeof message === 'string' ? text.includes(message) : message.test(text)
        )
      )
    ).toBeTruthy();
  }

  async expectFieldErrorContains(key: string, messages: Array<string | RegExp>) {
    const error = await this.fieldError(key);
    await expect(error).toBeVisible();

    const actualText = (await error.textContent())?.trim() ?? '';
    expect(
      messages.some((message) =>
        typeof message === 'string' ? actualText.includes(message) : message.test(actualText)
      )
    ).toBeTruthy();
  }

  async clearEditField(key: 'name' | 'e_mail') {
    const locator = key === 'name' ? await this.nameInput() : await this.emailInput();
    await locator.fill('');
  }

  async expectAccountFieldDisabled() {
    const accountInput = await this.accountInput();
    await expect(accountInput).toBeDisabled({ timeout: 2000 }).catch(async () => {
      await expect(accountInput).toHaveAttribute('disabled', '');
    });
  }

  async expectResetPasswordButtonVisible() {
    await expect(await this.resetPasswordButton()).toBeVisible();
  }

  async openResetPasswordDialog() {
    await (await this.resetPasswordButton()).click();
    await waitForUiSettled(this.page, 300);
  }

  async expectResetPasswordDialogVisible() {
    await expect(this.resetPasswordDialog).toBeVisible();
    await expect(this.resetPasswordDialog).toContainText(await this.text('reset_password'));
  }

  async fillResetPasswordForm(data: { password?: string; confirmPassword?: string }) {
    if (data.password !== undefined) {
      await (await this.resetPasswordInput()).fill(data.password);
    }

    if (data.confirmPassword !== undefined) {
      await (await this.resetConfirmPasswordInput()).fill(data.confirmPassword);
    }
  }

  async confirmResetPassword() {
    await this.resetPasswordFooter.locator('button').nth(1).click({ force: true });
    await waitForNetworkSettled(this.page);
  }

  async cancelResetPassword() {
    await this.resetPasswordFooter.locator('button').first().click({ force: true });
    await waitForUiSettled(this.page, 300);
  }

  async expectResetPasswordDialogHidden() {
    await expect(this.resetPasswordDialog).toBeHidden();
  }

  async expectResetPasswordRequiredErrors(count: number) {
    const requiredText = await this.text('required_field');
    const errors = this.resetPasswordDialog.locator('.el-form-item__error');

    await expect(errors).toHaveCount(count);
    await expect(errors).toHaveText(Array(count).fill(requiredText));
  }

  async expectResetPasswordFormErrorContains(messages: Array<string | RegExp>) {
    const errors = this.resetPasswordDialog.locator('.el-form-item__error');
    await expect(errors.first()).toBeVisible();

    const actualTexts = (await errors.allTextContents()).map((text) => text.trim());
    expect(
      messages.some((message) =>
        actualTexts.some((text) =>
          typeof message === 'string' ? text.includes(message) : message.test(text)
        )
      )
    ).toBeTruthy();
  }

  async expectResetPasswordConfirmDisabled() {
    await expect(this.resetPasswordFooter.locator('button').nth(1)).toBeDisabled();
  }

  async expectResetPasswordSuccessAlert() {
    await this.expectAlertContainsAny([
      await this.text('success'),
      await this.text('reset_password_success'),
      await this.text('update_success'),
    ]);
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
