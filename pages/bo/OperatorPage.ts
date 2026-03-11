import { Locator, Page, expect } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';

type OperatorStatus = 'Enable' | 'Disable' | 'Freeze';
type SearchType = 'Account' | 'Name';

export class BOOperatorPage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  readonly filterBox: Locator;
  readonly listBox: Locator;
  readonly addButton: Locator;
  readonly saveButton: Locator;
  readonly resetPasswordButton: Locator;
  readonly resetPasswordDialog: Locator;
  readonly resetPasswordFooter: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.filterBox = page.locator('.page-box').nth(0);
    this.listBox = page.locator('.page-box').nth(1);
    this.addButton = this.listBox.locator('button').first();
    this.saveButton = page.locator('.center-btn button').last();
    this.resetPasswordButton = page.getByRole('button', { name: /reset password/i }).last();
    this.resetPasswordDialog = page.locator('.el-dialog').filter({
      has: page.locator('.el-dialog__body form'),
    }).last();
    this.resetPasswordFooter = this.resetPasswordDialog.locator('.el-dialog__footer, [role="contentinfo"]').last();
    this.i18n = new BOI18n(page);
  }

  private async text(key: string): Promise<string> {
    return this.i18n.t(key);
  }

  private visibleOption(name: string): Locator {
    return this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({
      hasText: name,
    }).first();
  }

  private async waitForOverlayToSettle() {
    await this.page.waitForTimeout(500);
  }

  private fieldItemByLabel(label: string): Locator {
    return this.page.locator('.el-form-item').filter({
      has: this.page.getByText(label, { exact: true }),
    }).first();
  }

  private async fieldItemByKey(key: string): Promise<Locator> {
    return this.fieldItemByLabel(await this.text(key));
  }

  private async fieldSelectByKey(key: string): Promise<Locator> {
    return (await this.fieldItemByKey(key)).locator('.el-select__wrapper').first();
  }

  private async fieldErrorByKey(key: string): Promise<Locator> {
    return (await this.fieldItemByKey(key)).locator('.el-form-item__error').first();
  }

  private async resetPasswordInput(): Promise<Locator> {
    return this.resetPasswordDialog.getByLabel(await this.text('password'), { exact: true });
  }

  private async resetConfirmPasswordInput(): Promise<Locator> {
    return this.resetPasswordDialog.getByLabel(await this.text('confirm_password'));
  }

  private async addStatusText(status: OperatorStatus): Promise<string> {
    if (status === 'Enable') {
      return this.text('basic_status_1');
    }

    if (status === 'Disable') {
      return this.text('basic_status_0');
    }

    return this.text('basic_status_2');
  }

  private async searchTypeText(type: SearchType): Promise<string> {
    return this.text(type === 'Account' ? 'account' : 'name');
  }

  private alertMessage(): Locator {
    return this.page.locator('.el-message, [role="alert"]').last();
  }

  rowByAccount(account: string): Locator {
    return this.page.locator('tr.el-table__row').filter({
      has: this.page.getByText(account, { exact: true }),
    }).first();
  }

  async gotoOperatorList() {
    await this.sidebar.clickSubMenu('operator', 'operator_management');
  }

  async clickAddOperator() {
    await this.addButton.click({ force: true });
  }

  async gotoAddOperator() {
    await this.gotoOperatorList();
    await this.clickAddOperator();
  }

  async expectOperatorListVisible() {
    await expect(this.page).toHaveURL(/\/operator$/);
    await expect(this.page.getByText(await this.text('operator_management'), { exact: true }).last()).toBeVisible();
  }

  async expectAddOperatorVisible() {
    await expect(this.page).toHaveURL(/\/operator\/add$/);
    await expect(this.page.getByText(await this.text('basic_information'), { exact: true })).toBeVisible();
  }

  async selectAddSiteByIndex(index = 0) {
    await (await this.fieldSelectByKey('site')).click();
    await this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item').nth(index).click({ force: true });
    await this.waitForOverlayToSettle();
  }

  async selectAddStatus(status: OperatorStatus) {
    const wrapper = await this.fieldSelectByKey('state');
    const optionText = await this.addStatusText(status);

    await wrapper.click({ force: true });
    await this.visibleOption(optionText).click({ force: true });
    await this.waitForOverlayToSettle();
  }

  async selectAddRoleByIndex(index = 0) {
    await (await this.fieldSelectByKey('role')).click({ force: true });
    const options = this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item');
    await expect(options.nth(index)).toBeVisible();
    await options.nth(index).click({ force: true });
    await this.waitForOverlayToSettle();
  }

  async expectRoleDisabledBeforeSiteSelected() {
    await expect(await this.fieldSelectByKey('role')).toHaveClass(/is-disabled/);
  }

  async expectRoleEnabledAfterSiteSelected() {
    await expect(await this.fieldSelectByKey('role')).not.toHaveClass(/is-disabled/);
  }

  async expectStatusOptionsVisible() {
    const options = this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item');
    await expect(options).toHaveText([
      await this.text('basic_status_1'),
      await this.text('basic_status_0'),
      await this.text('basic_status_2'),
    ]);
  }

  async openAddStatusOptions() {
    await (await this.fieldSelectByKey('state')).click({ force: true });
  }

  async fillAddOperatorForm(data: {
    account?: string;
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }) {
    if (data.account !== undefined) {
      await this.page.getByLabel(await this.text('account')).fill(data.account);
    }

    if (data.name !== undefined) {
      await this.page.getByLabel(await this.text('name')).fill(data.name);
    }

    if (data.email !== undefined) {
      await this.page.getByLabel(await this.text('e_mail')).fill(data.email);
    }

    if (data.password !== undefined) {
      await this.page.getByLabel(await this.text('password'), { exact: true }).fill(data.password);
    }

    if (data.confirmPassword !== undefined) {
      await this.page.getByLabel(await this.text('confirm_password')).fill(data.confirmPassword);
    }
  }

  async save() {
    await this.saveButton.click({ force: true });
  }

  async createOperator(data: {
    account: string;
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    status?: OperatorStatus;
    siteIndex?: number;
    roleIndex?: number;
  }) {
    await this.selectAddSiteByIndex(data.siteIndex ?? 0);
    await this.fillAddOperatorForm({
      account: data.account,
      name: data.name,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword ?? data.password,
    });
    await this.selectAddStatus(data.status ?? 'Enable');
    await this.selectAddRoleByIndex(data.roleIndex ?? 0);
    await this.save();
  }

  async clickSearch() {
    await this.filterBox.locator('form.page-filter-form .el-form-item').last().locator('button').last().click({ force: true });
  }

  async clickReset() {
    await this.filterBox.locator('form.page-filter-form .el-form-item').last().locator('button').first().click({ force: true });
  }

  async searchByAccount(account: string) {
    await this.filterBox.locator('input.el-input__inner').first().fill(account);
    await this.clickSearch();
  }

  async searchByName(name: string) {
    await this.selectSearchType('Name');
    await this.filterBox.locator('input.el-input__inner').first().fill(name);
    await this.clickSearch();
  }

  async selectSearchType(type: SearchType) {
    const wrapper = this.filterBox.locator('.el-select__wrapper').nth(1);
    const optionText = await this.searchTypeText(type);

    await wrapper.click({ force: true });
    await this.visibleOption(optionText).click({ force: true });
  }

  async expectSearchValidationError(messages: Array<string | RegExp>) {
    const error = this.filterBox.locator('.el-form-item__error').first();
    await expect(error).toBeVisible();

    const actualText = (await error.textContent())?.trim() ?? '';
    expect(
      messages.some((message) =>
        typeof message === 'string' ? actualText.includes(message) : message.test(actualText)
      )
    ).toBeTruthy();
  }

  async expectRequiredValidationErrors(count: number) {
    const requiredText = await this.text('required_field');
    const errors = this.page.locator('.el-form-item__error');

    await expect(errors).toHaveCount(count);
    await expect(errors).toHaveText(Array(count).fill(requiredText));
  }

  async expectFieldErrorContains(key: 'account' | 'name' | 'e_mail' | 'password' | 'confirm_password' | 'role', messages: Array<string | RegExp>) {
    const error = await this.fieldErrorByKey(key);
    await expect(error).toBeVisible();

    const actualText = (await error.textContent())?.trim() ?? '';
    expect(
      messages.some((message) =>
        typeof message === 'string' ? actualText.includes(message) : message.test(actualText)
      )
    ).toBeTruthy();
  }

  async expectNoData() {
    await expect(this.listBox.getByText(await this.text('no_data'), { exact: true })).toBeVisible();
  }

  async expectOperatorInList(account: string) {
    await expect(this.listBox).toContainText(account);
  }

  async clickEditByAccount(account: string) {
    const row = this.rowByAccount(account);
    await expect(row).toBeVisible();
    await this.page.waitForTimeout(500);
    await row.locator('div.bg-mainBlue').first().click({ force: true });
  }

  async gotoEditByAccount(account: string) {
    await this.gotoOperatorList();
    await expect(this.rowByAccount(account)).toBeVisible();
    await this.clickEditByAccount(account);
    await expect(this.page).toHaveURL(/\/operator\/edit\?id=/);
  }

  async expectEditOperatorVisible() {
    await expect(this.page).toHaveURL(/\/operator\/edit\?id=/);
    await expect(this.page.getByText(await this.text('basic_information'), { exact: true })).toBeVisible();
  }

  async expectAccountFieldDisabled() {
    const accountInput = this.page.getByLabel(await this.text('account'));
    await expect(accountInput).toBeDisabled({ timeout: 2000 }).catch(async () => {
      await expect(accountInput).toHaveAttribute('disabled', '');
    });
  }

  async expectResetPasswordButtonVisible() {
    await expect(this.resetPasswordButton).toBeVisible();
  }

  async openResetPasswordDialog() {
    await expect(this.resetPasswordButton).toBeVisible();
    await expect(this.resetPasswordButton).toBeEnabled();
    await this.resetPasswordButton.click();
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
  }

  async cancelResetPassword() {
    await this.resetPasswordFooter.locator('button').first().click({ force: true });
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

  async changeEditStatus(status: OperatorStatus) {
    const wrapper = await this.fieldSelectByKey('state');
    const optionText = await this.addStatusText(status);

    await wrapper.click({ force: true });
    await this.visibleOption(optionText).click({ force: true });
    await this.waitForOverlayToSettle();
    await this.save();
  }

  async expectAlertContainsAny(messages: Array<string | RegExp>) {
    const alert = this.alertMessage();
    await expect(alert).toBeVisible();

    const actualText = (await alert.textContent())?.trim() ?? '';
    expect(
      messages.some((message) =>
        typeof message === 'string' ? actualText.includes(message) : message.test(actualText)
      )
    ).toBeTruthy();
  }

  async selectStatusFilter(status: OperatorStatus | 'All Statuses') {
    const wrapper = this.filterBox.locator('.el-select__wrapper').nth(2);
    const optionText = status === 'All Statuses' ? await this.text('all_status') : await this.addStatusText(status);

    await wrapper.click({ force: true });
    await this.visibleOption(optionText).click({ force: true });
  }

  async openStatusDialogByAccount(account: string) {
    const row = this.rowByAccount(account);
    await expect(row).toBeVisible();
    await this.page.waitForTimeout(500);
    await row.locator('span.cursor-pointer').click({ force: true });
  }

  async expectStatusDialogVisible(currentStatus: OperatorStatus) {
    const dialog = this.page.locator('.el-dialog').last();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(await this.text('change_status'));
    await expect(dialog.locator('.el-select__wrapper')).toContainText(await this.addStatusText(currentStatus));
  }

  async openStatusDialogOptions() {
    await this.page.locator('.el-dialog').last().locator('.el-select__wrapper').click({ force: true });
  }

  async selectStatusInDialog(status: OperatorStatus) {
    await this.openStatusDialogOptions();
    await this.visibleOption(await this.addStatusText(status)).click({ force: true });
    await this.waitForOverlayToSettle();
  }

  async expectStatusDialogOptionsVisible() {
    const options = this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item');
    await expect(options).toHaveText([
      await this.text('basic_status_0'),
      await this.text('basic_status_1'),
      await this.text('basic_status_2'),
    ]);
  }

  async cancelStatusDialog() {
    await this.page.locator('.el-dialog').last().locator('button.btn-blue').click({ force: true });
  }

  async confirmStatusDialog() {
    await this.page.locator('.el-dialog').last().locator('button.btn-primary').click({ force: true });
  }

  async expectStatusDialogHidden() {
    await expect(this.page.locator('.el-dialog').last()).toBeHidden();
  }
}
