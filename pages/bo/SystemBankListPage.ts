import { expect, Locator, Page } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';
import { waitForNetworkSettled, waitForUiSettled, waitForVisibleSelectOptions } from './CommonPage';

export class BOSystemBankListPage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  readonly filterBox: Locator;
  readonly listBox: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.filterBox = page.locator('.page-box').first();
    this.listBox = page.locator('.page-box').nth(1);
    this.i18n = new BOI18n(page);
  }

  private async text(key: string): Promise<string> {
    return this.i18n.t(key);
  }

  private async formItemByLabel(labelText: string): Promise<Locator> {
    return this.page.locator('.el-form-item').filter({
      has: this.page.locator('.el-form-item__label', { hasText: labelText }),
    }).first();
  }

  private async formInputByLabel(labelText: string): Promise<Locator> {
    return (await this.formItemByLabel(labelText)).locator('input.el-input__inner').last();
  }

  async copy(key: string, namespace: 'backend' | 'frontend' | 'error_code' = 'backend'): Promise<string> {
    return this.i18n.t(key, namespace);
  }

  async gotoSystemBankList() {
    await expect(this.page.getByText(await this.text('system_management'), { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await this.sidebar.clickSubMenu('system_management', 'system_bank_list');
  }

  async expectSystemBankListVisible() {
    await expect(this.page).toHaveURL(/\/system\/bank$/);
    await expect(this.page.getByText(await this.text('system_bank_list'), { exact: true }).last()).toBeVisible();
    await expect(this.filterBox.locator('.el-select__wrapper')).toBeVisible();
    await expect(this.filterBox.locator('input[placeholder]').nth(0)).toHaveAttribute(
      'placeholder',
      await this.text('bank_code'),
    );
    await expect(this.filterBox.locator('input[placeholder]').nth(1)).toHaveAttribute(
      'placeholder',
      await this.text('bank_name'),
    );
    await expect(this.filterBox.locator('button.btn-blue')).toBeVisible();
    await expect(this.filterBox.locator('button.btn-primary')).toBeVisible();
    await expect(this.listBox.locator('button.btn-blue').first()).toBeVisible();
    await expect(this.listBox.locator('table').first()).toBeVisible();
  }

  listRows(): Locator {
    return this.listBox.locator('tr.el-table__row');
  }

  topRow(): Locator {
    return this.listRows().first();
  }

  rowByBankCode(bankCode: string): Locator {
    return this.listRows().filter({
      has: this.page.locator('td .cell', { hasText: bankCode }),
    }).first();
  }

  async topRowTexts(): Promise<string[]> {
    const cells = this.topRow().locator('td');
    return (await cells.allInnerTexts()).map((text) => text.trim()).filter(Boolean);
  }

  async filterRegionText(): Promise<string> {
    return (await this.filterBox.locator('.el-select__wrapper').first().innerText()).trim();
  }

  async openRegionOptions() {
    await this.filterBox.locator('.el-select__wrapper').click({ force: true });
    await waitForVisibleSelectOptions(this.page);
  }

  async regionOptions(): Promise<string[]> {
    return this.page
      .locator('.el-select-dropdown:visible .el-select-dropdown__item')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? '').filter(Boolean));
  }

  private async selectVisibleOption(text: string) {
    await this.page
      .locator('.el-select-dropdown:visible .el-select-dropdown__item')
      .filter({ hasText: new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
      .first()
      .click({ force: true });
    await waitForUiSettled(this.page);
  }

  async openTopRowEdit() {
    await this.topRow().locator('.bg-mainBlue.el-tooltip__trigger').first().click();
    await waitForNetworkSettled(this.page);
  }

  async expectListHasRows() {
    await expect(this.listRows().first()).toBeVisible();
  }

  async fillBankCode(value: string) {
    await this.filterBox.locator('input.el-input__inner').nth(0).fill(value);
  }

  async fillBankName(value: string) {
    await this.filterBox.locator('input.el-input__inner').nth(1).fill(value);
  }

  async selectFilterRegion(region: string) {
    const combobox = this.filterBox.getByRole('combobox').first();
    await combobox.focus();
    await this.page.keyboard.press('ArrowDown');
    await waitForVisibleSelectOptions(this.page);
    await this.selectVisibleOption(region);
  }

  async clickSearch() {
    await this.filterBox.locator('button.btn-primary').click();
    await waitForNetworkSettled(this.page);
  }

  async clickReset() {
    await this.filterBox.locator('button.btn-blue').click();
    await waitForNetworkSettled(this.page);
  }

  async filterFieldValues() {
    return {
      bankCode: await this.filterBox.locator('input.el-input__inner').nth(0).inputValue(),
      bankName: await this.filterBox.locator('input.el-input__inner').nth(1).inputValue(),
    };
  }

  async clickAddBank() {
    await this.listBox.locator('button.btn-blue').first().click();
    await waitForNetworkSettled(this.page);
  }

  async expectAddPageVisible() {
    await expect(this.page).toHaveURL(/\/system\/bank\/add$/);
    await expect(this.page.getByText(await this.text('system_bank_list'), { exact: true }).last()).toBeVisible();
    await expect(await this.formInputByLabel(await this.text('bank_code'))).toHaveValue('');
    await expect(await this.formInputByLabel(await this.text('bank_name'))).toHaveValue('');
  }

  async selectFormRegion(region: string) {
    const combobox = this.page.getByRole('combobox').nth(1);
    await combobox.focus();
    await this.page.keyboard.press('ArrowDown');
    await waitForVisibleSelectOptions(this.page);
    await this.selectVisibleOption(region);
  }

  async fillFormBankCode(value: string) {
    const input = await this.formInputByLabel(await this.text('bank_code'));
    await input.click();
    await input.press('ControlOrMeta+A');
    await input.fill(value);
  }

  async fillFormBankName(value: string) {
    const input = await this.formInputByLabel(await this.text('bank_name'));
    await input.click();
    await input.press('ControlOrMeta+A');
    await input.fill(value);
  }

  async submitForm() {
    await this.page.locator('button.btn-primary').last().click();
    await waitForNetworkSettled(this.page);
  }

  async cancelForm() {
    await this.page.locator('button.btn-blue').last().click();
    await waitForNetworkSettled(this.page);
  }

  async createBank(data: { region: string; bankCode: string; bankName: string }) {
    await this.selectFormRegion(data.region);
    await this.fillFormBankCode(data.bankCode);
    await this.fillFormBankName(data.bankName);
    await this.submitForm();
  }

  async expectEditPageVisible() {
    await expect(this.page).toHaveURL(/\/system\/bank\/edit\?id=/);
    await expect(this.page.getByText(await this.text('system_bank_list'), { exact: true }).last()).toBeVisible();
    await expect(await this.formInputByLabel(await this.text('bank_code'))).toBeVisible();
    await expect(await this.formInputByLabel(await this.text('bank_name'))).toBeVisible();
  }

  async editFieldValues() {
    return {
      bankCode: await (await this.formInputByLabel(await this.text('bank_code'))).inputValue(),
      bankName: await (await this.formInputByLabel(await this.text('bank_name'))).inputValue(),
    };
  }

  async expectToastContains(message: string | RegExp) {
    const toast = this.page.locator('.el-message, [role="alert"]').last();
    await expect(toast).toBeVisible();
    if (typeof message === 'string') {
      await expect(toast).toContainText(message);
      return;
    }

    await expect(toast).toContainText(message);
  }

  async expectFormErrorCount(message: string, count: number) {
    await expect(this.page.locator('.el-form-item__error').filter({ hasText: message })).toHaveCount(count);
  }

  async expectAlertContains(message: string | RegExp) {
    const alert = this.page.locator('.el-message, [role="alert"]').last();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(message);
  }

  async searchByBankCode(bankCode: string) {
    await this.fillBankCode(bankCode);
    await this.clickSearch();
  }

  async searchByBankName(bankName: string) {
    await this.fillBankName(bankName);
    await this.clickSearch();
  }

  async expectAllRowsContain(text: string) {
    const rowTexts = await this.listRows().evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
    );

    for (const rowText of rowTexts) {
      expect(rowText).toContain(text);
    }
  }

  async expectNoData() {
    await expect(this.listBox).toContainText(await this.copy('no_data'));
  }

  async expectBankInList(bankCode: string, bankName?: string) {
    const row = this.rowByBankCode(bankCode);
    await expect(row).toBeVisible();
    if (bankName) {
      await expect(row).toContainText(bankName);
    }
  }

  async expectBankInListEventually(bankCode: string, bankName: string, attempts = 5) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      await this.searchByBankCode(bankCode);
      const row = this.rowByBankCode(bankCode);

      if (await row.count()) {
        const text = (await row.innerText()).replace(/\s+/g, ' ').trim();
        if (text.includes(bankName)) {
          return;
        }
      }

      await this.page.reload({ waitUntil: 'networkidle' });
    }

    await this.expectBankInList(bankCode, bankName);
  }

  async openEditByBankCode(bankCode: string) {
    const row = this.rowByBankCode(bankCode);
    await expect(row).toBeVisible();
    await row.locator('.bg-mainBlue.el-tooltip__trigger').first().click();
    await waitForNetworkSettled(this.page);
  }
}
