import { Page, Locator, expect } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';
import { waitForNetworkSettled, waitForUiSettled, waitForVisibleSelectOptions } from './CommonPage';

export type AgentStatus = 'Enable' | 'Disable';
export type AgentSearchType = 'Account' | 'Name';
export type AgentStatusFilter = 'All Statuses' | AgentStatus;

export class BOAgentListPage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  private readonly i18n: BOI18n;

  // Page boxes
  readonly filterBox: Locator;
  readonly listBox: Locator;

  // Persistent locators
  readonly addButton: Locator;
  readonly saveButton: Locator;
  readonly keywordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.i18n = new BOI18n(page);

    this.filterBox = page.locator('.page-box').nth(0);
    this.listBox = page.locator('.page-box').nth(1);

    this.addButton = this.listBox.locator('button').first();
    this.saveButton = page.locator('.center-btn button.btn-primary').last();
    this.keywordInput = this.filterBox.locator('input.el-input__inner').first();
  }

  private async text(key: string): Promise<string> {
    return this.i18n.t(key);
  }

  // ─── Status helpers ───────────────────────────────────────────────────────

  private async statusTexts(status: AgentStatus): Promise<string[]> {
    const keys =
      status === 'Enable'
        ? ['simple_status_1', 'basic_status_1', 'status_1', 'enable']
        : ['simple_status_0', 'basic_status_0', 'status_0'];

    const values = await Promise.all(keys.map((k) => this.text(k)));
    return [...new Set(values.filter(Boolean))];
  }

  private async statusMatchesText(text: string, status: AgentStatus): Promise<boolean> {
    const candidates = await this.statusTexts(status);
    return candidates.some((c) => text.includes(c));
  }

  private fallbackStatusIndex(status: AgentStatus): number {
    return status === 'Enable' ? 0 : 1;
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  private visibleOptions(): Locator {
    return this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item');
  }

  private visibleOptionByText(text: string): Locator {
    return this.visibleOptions().filter({ hasText: text }).first();
  }

  private async selectVisibleStatusOption(status: AgentStatus) {
    const options = this.visibleOptions();
    const optionTexts = await this.statusTexts(status);

    await expect(options.first()).toBeVisible();

    for (const optionText of optionTexts) {
      const option = options.filter({ hasText: optionText }).first();
      if (await option.count()) {
        await option.click({ force: true });
        return;
      }
    }

    await options.nth(this.fallbackStatusIndex(status)).click({ force: true });
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

  private async waitForListToSettle() {
    await waitForNetworkSettled(this.page, 800);
  }

  rowByAccount(account: string): Locator {
    return this.page.locator('tr.el-table__row').filter({
      has: this.page.locator('td .cell', { hasText: account }),
    }).first();
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  async gotoAgentList() {
    await this.sidebar.clickSubMenu('agent', 'agent_management');
  }

  async clickAddAgent() {
    await this.addButton.click({ force: true });
    await this.waitForListToSettle();
  }

  async gotoAddAgent() {
    await this.gotoAgentList();
    await this.clickAddAgent();
  }

  // ─── Create / Edit form ───────────────────────────────────────────────────

  /** Select the site on the create/edit form by index in the dropdown. */
  async selectSiteByIndex(index = 0) {
    await (await this.fieldSelectByKey('site')).click({ force: true });
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOptions().nth(index).click({ force: true });
    await waitForUiSettled(this.page);
  }

  /**
   * Select the superior agent on the create form.
   * Clicks the select wrapper associated with `superior_agent` label and picks by index.
   */
  async selectSuperiorAgentByIndex(index = 0) {
    await (await this.fieldSelectByKey('superior_agent')).click({ force: true });
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOptions().nth(index).click({ force: true });
    await waitForUiSettled(this.page);
  }

  async selectStatus(status: AgentStatus) {
    await (await this.fieldSelectByKey('state')).click({ force: true });
    await this.selectVisibleStatusOption(status);
    await waitForUiSettled(this.page);
  }

  async fillCreateAgentForm(data: {
    account?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
    email?: string;
    status?: AgentStatus;
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

    if (data.status !== undefined) {
      await this.selectStatus(data.status);
    }
  }

  async fillEditAgentForm(data: {
    name?: string;
    email?: string;
    status?: AgentStatus;
  }) {
    if (data.name !== undefined) {
      await this.page.getByLabel(await this.text('name')).fill(data.name);
    }

    if (data.email !== undefined) {
      await this.page.getByLabel(await this.text('e_mail')).fill(data.email);
    }

    if (data.status !== undefined) {
      await this.selectStatus(data.status);
    }
  }

  async save() {
    await this.saveButton.click({ force: true });
    await this.waitForListToSettle();
  }

  async createAgent(data: {
    account: string;
    password: string;
    confirmPassword?: string;
    name?: string;
    email?: string;
    siteIndex?: number;
    superiorAgentIndex?: number;
    status?: AgentStatus;
  }) {
    await this.selectSiteByIndex(data.siteIndex ?? 0);
    await this.selectSuperiorAgentByIndex(data.superiorAgentIndex ?? 0);
    await this.fillCreateAgentForm({
      account: data.account,
      password: data.password,
      confirmPassword: data.confirmPassword ?? data.password,
      name: data.name,
      email: data.email,
      status: data.status,
    });
    await this.save();
  }

  // ─── Filter / Search ──────────────────────────────────────────────────────

  async fillKeyword(keyword: string) {
    await this.keywordInput.fill(keyword);
  }

  async selectSearchType(type: AgentSearchType) {
    const optionText = await this.text(type === 'Account' ? 'agent_account' : 'name');
    // Search-type select is typically the second select in the filter box
    await this.filterBox.locator('.el-select__wrapper').nth(1).click({ force: true });
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOptionByText(optionText).click({ force: true });
    await waitForUiSettled(this.page);
  }

  async selectStatusFilter(status: AgentStatusFilter) {
    const optionText =
      status === 'All Statuses'
        ? await this.text('all_status')
        : (await this.statusTexts(status))[0];

    // Status filter select is typically the last select in the filter box
    await this.filterBox.locator('.el-select__wrapper').last().click({ force: true });
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOptionByText(optionText!).click({ force: true });
    await waitForUiSettled(this.page);
  }

  async clickSearch() {
    await this.filterBox
      .locator('form.page-filter-form .el-form-item')
      .last()
      .locator('button')
      .last()
      .click({ force: true });
    await this.waitForListToSettle();
  }

  async clickReset() {
    await this.filterBox
      .locator('form.page-filter-form .el-form-item')
      .last()
      .locator('button')
      .first()
      .click({ force: true });
    await this.waitForListToSettle();
  }

  async searchByAccount(account: string) {
    await this.fillKeyword(account);
    await this.clickSearch();
  }

  // ─── Row actions ──────────────────────────────────────────────────────────

  async clickEditByAccount(account: string) {
    const row = this.rowByAccount(account);
    await expect(row).toBeVisible();
    await waitForUiSettled(this.page, 300);
    await row.locator('div.bg-mainBlue').first().click({ force: true });
    await this.waitForListToSettle();
  }

  async gotoEditByAccount(account: string) {
    await this.gotoAgentList();
    await this.searchByAccount(account);
    await this.clickEditByAccount(account);
  }

  // ─── Reset password dialog ────────────────────────────────────────────────

  private resetPasswordDialog(): Locator {
    return this.page.locator('.el-dialog').filter({
      has: this.page.locator('.el-dialog__body form'),
    }).last();
  }

  private resetPasswordFooter(): Locator {
    return this.resetPasswordDialog().locator('.el-dialog__footer, [role="contentinfo"]').last();
  }

  private async resetPasswordButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: await this.text('reset_password'), exact: true }).last();
  }

  async expectResetPasswordButtonVisible() {
    await expect(await this.resetPasswordButton()).toBeVisible();
  }

  async openResetPasswordDialog() {
    const button = await this.resetPasswordButton();
    await expect(button).toBeVisible();
    await button.click();
    await waitForUiSettled(this.page, 300);
  }

  async expectResetPasswordDialogVisible() {
    await expect(this.resetPasswordDialog()).toBeVisible();
    await expect(this.resetPasswordDialog()).toContainText(await this.text('reset_password'));
  }

  async fillResetPasswordForm(data: { password?: string; confirmPassword?: string }) {
    const dialog = this.resetPasswordDialog();

    if (data.password !== undefined) {
      await dialog.getByLabel(await this.text('password'), { exact: true }).fill(data.password);
    }

    if (data.confirmPassword !== undefined) {
      await dialog.getByLabel(await this.text('confirm_password')).fill(data.confirmPassword);
    }
  }

  async confirmResetPassword() {
    await this.resetPasswordFooter().locator('button').nth(1).click({ force: true });
    await waitForNetworkSettled(this.page);
  }

  async cancelResetPassword() {
    await this.resetPasswordFooter().locator('button').first().click({ force: true });
    await waitForUiSettled(this.page, 300);
  }

  async expectResetPasswordDialogHidden() {
    await expect(this.resetPasswordDialog()).toBeHidden();
  }

  async expectResetPasswordRequiredErrors(count: number) {
    const requiredText = await this.text('required_field');
    const errors = this.resetPasswordDialog().locator('.el-form-item__error');

    await expect(errors).toHaveCount(count);
    await expect(errors).toHaveText(Array(count).fill(requiredText));
  }

  async expectResetPasswordFormErrorContains(messages: Array<string | RegExp>) {
    const errors = this.resetPasswordDialog().locator('.el-form-item__error');
    await expect(errors.first()).toBeVisible();

    const actualTexts = (await errors.allTextContents()).map((t) => t.trim());
    expect(
      messages.some((message) =>
        actualTexts.some((text) =>
          typeof message === 'string' ? text.includes(message) : message.test(text)
        )
      )
    ).toBeTruthy();
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async expectAgentListVisible() {
    await expect(this.page).toHaveURL(/\/agent(\?|$)/);
    await expect(this.listBox).toBeVisible();
  }

  async expectAddAgentVisible() {
    await expect(this.page).toHaveURL(/\/agent\/add/);
  }

  async expectEditAgentVisible() {
    await expect(this.page).toHaveURL(/\/agent\/edit/);
  }

  async expectAgentInList(account: string) {
    await expect
      .poll(async () => ((await this.listBox.textContent()) ?? '').includes(account), {
        timeout: 15000,
        intervals: [500, 1000, 1500],
      })
      .toBeTruthy();
  }

  async expectNoData() {
    await expect(
      this.listBox.getByText(await this.text('no_data'), { exact: true })
    ).toBeVisible();
  }

  async expectKeywordCleared() {
    await expect(this.keywordInput).toHaveValue('');
  }

  async expectRowContainsText(account: string, text: string) {
    await expect(this.rowByAccount(account)).toContainText(text);
  }

  async expectStatusInList(account: string, status: AgentStatus) {
    const row = this.rowByAccount(account);
    const statusSwitch = row.getByRole('switch');

    await expect(statusSwitch).toHaveAttribute(
      'aria-checked',
      status === 'Enable' ? 'true' : 'false'
    );
  }

  async expectAccountFieldDisabled() {
    const input = this.page.getByLabel(await this.text('account'));
    await expect(input).toBeDisabled({ timeout: 2000 }).catch(async () => {
      await expect(input).toHaveAttribute('disabled', '');
    });
  }

  async expectRequiredValidationErrors(count: number) {
    const requiredText = await this.text('required_field');
    const errors = this.page.locator('.el-form-item__error');

    await expect(errors).toHaveCount(count);
    await expect(errors).toHaveText(Array(count).fill(requiredText));
  }

  async expectAlertContainsAny(messages: Array<string | RegExp>) {
    const alerts = this.page.locator('.el-message, [role="alert"]');
    await expect(alerts.first()).toBeVisible();

    const actualTexts = ((await alerts.allTextContents()) ?? []).map((t) => t.trim());
    expect(
      messages.some((message) =>
        actualTexts.some((text) =>
          typeof message === 'string' ? text.includes(message) : message.test(text)
        )
      )
    ).toBeTruthy();
  }

  async expectFieldErrorContains(
    key: string,
    messages: Array<string | RegExp>
  ) {
    const error = await this.fieldErrorByKey(key);
    await expect(error).toBeVisible();

    const actualText = (await error.textContent())?.trim() ?? '';
    expect(
      messages.some((message) =>
        typeof message === 'string' ? actualText.includes(message) : message.test(actualText)
      )
    ).toBeTruthy();
  }

  async expectCreateSuccessAlert() {
    await this.expectAlertContainsAny([
      await this.text('success'),
      await this.text('added_successfully'),
    ]);
  }

  async expectUpdateSuccessAlert() {
    await this.expectAlertContainsAny([
      await this.text('success'),
      await this.text('update_success'),
      await this.text('edit_success'),
    ]);
  }

  async expectResetPasswordSuccessAlert() {
    await this.expectAlertContainsAny([
      await this.text('success'),
      await this.text('reset_password_success'),
      await this.text('update_success'),
    ]);
  }
}
