import { expect, Locator, Page } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';
import { waitForAlertOrIdle, waitForNetworkSettled, waitForUiSettled, waitForVisibleSelectOptions } from './CommonPage';

export class BOGameProviderPage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  readonly filterBox: Locator;
  readonly listBox: Locator;
  readonly detailBox: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.filterBox = page.locator('.page-box').first();
    this.listBox = page.locator('.page-box').nth(1);
    this.detailBox = page.locator('.page-box').first();
    this.i18n = new BOI18n(page);
  }

  private async text(key: string): Promise<string> {
    return this.i18n.t(key);
  }

  private async label(key: string): Promise<string> {
    const backendText = await this.i18n.t(key, 'backend');
    if (backendText !== key) {
      return backendText;
    }

    return this.i18n.t(key, 'frontend');
  }

  async copy(key: string, namespace: 'backend' | 'frontend' | 'error_code' = 'backend'): Promise<string> {
    return this.i18n.t(key, namespace);
  }

  private visibleOption(text: string): Locator {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.page
      .locator('.el-select-dropdown:visible .el-select-dropdown__item')
      .filter({ hasText: new RegExp(`^${escaped}$`) })
      .first();
  }

  private providerListRows(): Locator {
    return this.listBox.locator('tr.el-table__row');
  }

  private gameListRows(): Locator {
    return this.detailBox.locator('tr.el-table__row');
  }

  private providerListPager(): Locator {
    return this.listBox.locator('.el-pagination').last();
  }

  private gameListPager(): Locator {
    return this.detailBox.locator('.el-pagination').last();
  }

  private addGameDialog(): Locator {
    return this.page.locator('.el-dialog').last();
  }

  private dialogFormItemByLabel(labelText: string): Locator {
    return this.addGameDialog().locator('.el-form-item').filter({
      has: this.addGameDialog().locator('.el-form-item__label', { hasText: new RegExp(`^${labelText}$`) }),
    }).first();
  }

  private dialogInputByLabel(labelText: string): Locator {
    return this.addGameDialog().getByLabel(labelText, { exact: true });
  }

  private filterButton(action: 'reset' | 'search'): Locator {
    const buttonClass = action === 'reset' ? '.btn-blue' : '.btn-primary';
    return this.filterBox.locator(`button${buttonClass}`).first();
  }

  private async setFilterSelect(index: number, optionText: string) {
    const wrapper = this.filterBox.locator('.el-select__wrapper').nth(index);
    await wrapper.scrollIntoViewIfNeeded();
    await wrapper.click({ force: true });
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOption(optionText).click({ force: true });
    await waitForUiSettled(this.page);
  }

  async providerText(provider: string): Promise<string> {
    return provider;
  }

  async typeText(key: 'game_category_1' | 'game_category_3' | 'game_category_4' | 'game_category_5' | 'game_category_6' | 'game_category_7') {
    return this.label(key);
  }

  async statusText(status: 'Enable' | 'Disable'): Promise<string> {
    return this.label(status === 'Enable' ? 'simple_status_1' : 'simple_status_0');
  }

  async gotoGameProviderList() {
    await expect(this.page.getByText(await this.text('system_management'), { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await this.sidebar.clickSubMenu('system_management', 'game_provider');
  }

  async expectGameProviderListVisible() {
    await expect(this.page).toHaveURL(/\/system\/game/);
    await expect(this.page.getByText(await this.text('game_provider'), { exact: true }).last()).toBeVisible();
    await expect(this.filterBox).toContainText(await this.text('all_game_provider'));
    await expect(this.filterBox).toContainText(await this.text('all_status'));
    await expect(this.page.locator('tr.el-table__row').first()).toBeVisible();
  }

  async clickSearch() {
    await this.filterButton('search').click({ force: true });
    await waitForNetworkSettled(this.page);
  }

  async clickReset() {
    await this.filterButton('reset').click({ force: true });
    await waitForNetworkSettled(this.page);
  }

  async selectProvider(providerName: string) {
    await this.setFilterSelect(0, providerName);
  }

  async selectType(typeText: string) {
    await this.setFilterSelect(1, typeText);
  }

  async selectStatus(status: 'Enable' | 'Disable') {
    await this.setFilterSelect(2, await this.statusText(status));
  }

  rowByProvider(providerName: string): Locator {
    return this.providerListRows().filter({
      has: this.page.locator('td .cell', { hasText: providerName }),
    }).first();
  }

  async expectSearchShowsProvider(providerName: string) {
    await expect(this.rowByProvider(providerName)).toBeVisible();
  }

  async topRowTexts(): Promise<string[]> {
    const cells = this.providerListRows().first().locator('td');
    return (await cells.allInnerTexts()).map((text) => text.trim()).filter(Boolean);
  }

  async rowTextsByProvider(providerName: string): Promise<string[]> {
    const cells = this.rowByProvider(providerName).locator('td');
    return (await cells.allInnerTexts()).map((text) => text.trim()).filter(Boolean);
  }

  async openFirstRowGameList() {
    const firstAction = this.providerListRows().first().locator('.bg-mainBlue.el-tooltip__trigger').first();
    await firstAction.click();
    await waitForNetworkSettled(this.page, 1000);
  }

  async openRowGameList(providerName: string) {
    const firstAction = this.rowByProvider(providerName).locator('.bg-mainBlue.el-tooltip__trigger').first();
    await firstAction.click();
    await waitForNetworkSettled(this.page, 1000);
  }

  async expectProviderGameListVisible(providerName: string, typeText: string) {
    await expect(this.page.getByText(await this.text('back_to_providers'), { exact: true })).toBeVisible();
    await expect(this.detailBox).toContainText(providerName);
    await expect(this.detailBox).toContainText(typeText);
    await expect(this.gameListRows().first()).toBeVisible();
  }

  async clickBackToProviders() {
    await this.page.getByText(await this.text('back_to_providers'), { exact: true }).click();
    await waitForNetworkSettled(this.page, 800);
  }

  async expectReturnedToProviderList() {
    await this.expectGameProviderListVisible();
    await expect(this.page.getByText(await this.text('back_to_providers'), { exact: true })).toHaveCount(0);
  }

  async openFirstRowApiDialog() {
    await this.providerListRows().first().locator('.bg-mainBlue.el-tooltip__trigger').nth(1).click();
    await waitForUiSettled(this.page, 800);
  }

  async expectApiDialogVisible(providerName: string) {
    const dialog = this.addGameDialog();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`${providerName} - ${await this.copy('api_settings')}`);
    await expect(dialog).toContainText(await this.copy('select_site'));
  }

  async closeApiDialog() {
    const dialog = this.addGameDialog();
    const closeButton = dialog.locator('.el-dialog__headerbtn');
    await closeButton.click();
    await expect(dialog).toBeHidden();
  }

  async confirmApiDialog() {
    await this.addGameDialog().locator('.el-dialog__footer button.btn-primary').click();
    await waitForNetworkSettled(this.page);
  }

  async selectApiSite(siteName: string) {
    const dialog = this.addGameDialog();
    await dialog.locator('.el-select__wrapper').click({ force: true });
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOption(siteName).click({ force: true });
    await waitForUiSettled(this.page, 600);
  }

  async selectFirstVisibleApiSiteExcluding(forbiddenSite: string): Promise<string> {
    const dialog = this.addGameDialog();
    await dialog.locator('.el-select__wrapper').click({ force: true });
    const options = this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item');
    await waitForVisibleSelectOptions(this.page);
    const firstOption = options.first();
    const selected = (await firstOption.innerText()).trim();
    if (!selected || selected === forbiddenSite) {
      throw new Error(`No API site option available outside ${forbiddenSite}`);
    }

    await firstOption.click({ force: true });
    await waitForUiSettled(this.page, 600);
    return selected;
  }

  async expectApiDialogRequiredError() {
    await expect(this.addGameDialog().locator('.el-form-item__error')).toContainText(await this.copy('required_field'));
  }

  async expectApiJsonAndRemarkVisible(siteName: string) {
    const dialog = this.addGameDialog();
    await expect(dialog).toContainText(siteName);
    await expect(dialog).toContainText('JSON');
    await expect(dialog).toContainText(await this.copy('remark'));
    await expect(dialog.locator('textarea')).toHaveCount(2);
  }

  async clickAddGame() {
    await this.detailBox.locator('button.btn-blue').last().click();
    await waitForUiSettled(this.page, 800);
  }

  async expectAddGameDialogVisible() {
    const dialog = this.addGameDialog();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(await this.copy('game_name'));
    await expect(dialog).toContainText(await this.copy('upload_image'));
  }

  async closeAddGameDialog() {
    const dialog = this.addGameDialog();
    const closeButton = dialog.locator('.el-dialog__headerbtn');
    if (await closeButton.count()) {
      await closeButton.click();
    } else {
      await dialog.locator('.el-dialog__footer button.btn-blue').click();
    }
    await expect(dialog).toBeHidden();
  }

  async confirmAddGameDialog() {
    const dialog = this.addGameDialog();
    await dialog.locator('.el-dialog__footer button.btn-primary').click();
    await waitForNetworkSettled(this.page);
  }

  async expectAddGameRequiredErrors() {
    const dialog = this.addGameDialog();
    const errors = dialog.locator('.el-form-item__error');
    await expect(errors).toHaveCount(4);
    await expect(errors.filter({ hasText: await this.copy('required_field') })).toHaveCount(3);
    await expect(errors.last()).toBeVisible();
  }

  async fillGameName(languageLabel: string, value: string) {
    await this.dialogInputByLabel(languageLabel).fill(value);
  }

  async fillGameParameter(labelText: string, value: string) {
    await this.dialogInputByLabel(labelText).fill(value);
  }

  async uploadGameImage(filePath: string) {
    await this.addGameDialog().locator('input[type=file]').setInputFiles(filePath);
    await waitForAlertOrIdle(this.page, 800);
  }

  async visibleGameParameterLabels(): Promise<string[]> {
    return this.addGameDialog()
      .locator('.el-form-item.is-required')
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => {
            const label = node.querySelector('.el-form-item__label')?.textContent?.trim() ?? '';
            return Boolean(label) && label !== 'Status' && node.querySelector('input.el-input__inner');
          })
          .map((node) => node.querySelector('.el-form-item__label')?.textContent?.trim() ?? ''),
      );
  }

  async expectVisibleGameParameterFields(labels: string[]) {
    for (const label of labels) {
      await expect(this.dialogInputByLabel(label)).toBeVisible();
    }
  }

  async expectRequiredErrorsForGameParameters(parameterLabels: string[]) {
    await expect(this.addGameDialog().locator('.el-form-item__error').filter({ hasText: await this.copy('required_field') }))
      .toHaveCount(parameterLabels.length);
  }

  async expectUploadImageRequiredError() {
    await expect(this.addGameDialog()).toContainText(await this.label('please_upload_image'));
  }

  async expectToastSuccess() {
    await expect(this.page.locator('.el-message')).toContainText(await this.copy('success'));
  }

  async goToGameListPage(pageNumber: number) {
    await this.gameListPager().locator(`.el-pager li[aria-label="page ${pageNumber}"]`).click();
    await waitForNetworkSettled(this.page, 800);
  }

  async lastGameListPageNumber(): Promise<number> {
    const labels = await this.gameListPager()
      .locator('.el-pager li.number')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => Number.parseInt(node.textContent?.trim() ?? '', 10))
          .filter((value) => Number.isFinite(value)),
      );

    return labels[labels.length - 1] ?? 1;
  }

  gameRowByName(gameName: string): Locator {
    return this.gameListRows().filter({
      has: this.page.locator('td .cell', { hasText: gameName }),
    }).first();
  }

  async expectGameRowVisible(gameName: string) {
    await expect(this.gameRowByName(gameName)).toBeVisible();
  }

  async openPageContainingGame(gameName: string): Promise<boolean> {
    const lastPage = await this.lastGameListPageNumber();

    for (let pageNumber = 1; pageNumber <= lastPage; pageNumber += 1) {
      await this.goToGameListPage(pageNumber);
      if (await this.gameRowByName(gameName).count()) {
        return true;
      }
    }

    return false;
  }

  async openGameEditByName(gameName: string) {
    await this.gameRowByName(gameName).locator('.bg-mainBlue.el-tooltip__trigger').first().click();
    await waitForUiSettled(this.page, 800);
  }

  async expectEditGameDialogVisible() {
    await expect(this.addGameDialog()).toBeVisible();
    await expect(this.addGameDialog()).toContainText(await this.copy('game_name'));
  }

  async inputValueByLabel(labelText: string): Promise<string> {
    return this.dialogInputByLabel(labelText).inputValue();
  }
}
