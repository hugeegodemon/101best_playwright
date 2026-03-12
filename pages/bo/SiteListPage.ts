import { expect, Locator, Page } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';

export type SiteTemplate = 'Layout 1' | 'Layout 2';

export class BOSiteListPage {
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

  private format(template: string, vars?: Record<string, string | number>): string {
    if (!vars) {
      return template;
    }

    return Object.entries(vars).reduce(
      (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
      template
    );
  }

  private async label(key: string): Promise<string> {
    const backendText = await this.i18n.t(key, 'backend');
    if (backendText !== key) {
      return backendText;
    }

    return this.i18n.t(key, 'frontend');
  }

  async copy(
    key: string,
    namespace: 'backend' | 'frontend' | 'error_code' = 'backend',
    vars?: Record<string, string | number>
  ): Promise<string> {
    return this.format(await this.i18n.t(key, namespace), vars);
  }

  async hiddenCodePlaceholderText(min = 1, max = 8): Promise<string> {
    return this.copy('sender_placeholder', 'backend', { number1: min, number2: max });
  }

  private async filterStatusText(status: 'Enable' | 'Disable'): Promise<string> {
    return this.label(status === 'Enable' ? 'basic_status_1' : 'basic_status_0');
  }

  private async simpleStatusText(status: 'Enable' | 'Disable'): Promise<string> {
    return this.label(status === 'Enable' ? 'simple_status_1' : 'simple_status_0');
  }

  private async templateText(template: SiteTemplate): Promise<string> {
    return this.copy(template === 'Layout 1' ? 'template_1' : 'template_2');
  }

  async regionText(key = 'region_code_1'): Promise<string> {
    return this.copy(key);
  }

  async localeText(key = 'locale_0'): Promise<string> {
    return this.copy(key);
  }

  async gameProviderText(key = 'slots'): Promise<string> {
    return this.label(key);
  }

  private async actionButton(key: string): Promise<Locator> {
    const buttonClass = key === 'prev_step' ? '.btn-blue' : '.btn-primary';
    return this.page.locator(`.center-btn button${buttonClass}`).first();
  }

  private filterButton(action: 'reset' | 'search'): Locator {
    const buttonClass = action === 'reset' ? '.btn-blue' : '.btn-primary';
    return this.filterBox.locator(`button${buttonClass}`).first();
  }

  private listActionButton(action: 'add'): Locator {
    return this.listBox.locator('button.btn-blue').first();
  }

  private uploadInput(index: number): Locator {
    return this.page.locator('input[type=file]').nth(index);
  }

  private visibleOption(text: string): Locator {
    return this.page
      .locator('.el-select-dropdown:visible .el-select-dropdown__item')
      .filter({ hasText: text })
      .last();
  }

  private async labeledFormItem(label: string, index = 0): Promise<Locator> {
    return this.page
      .locator('.el-form-item')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .nth(index);
  }

  private async labeledFormItemByKey(key: string, index = 0): Promise<Locator> {
    return this.labeledFormItem(await this.label(key), index);
  }

  private async inputByLabel(label: string, index = 0): Promise<Locator> {
    return (await this.labeledFormItem(label, index)).locator('input.el-input__inner').first();
  }

  private async inputByKey(key: string, index = 0): Promise<Locator> {
    return this.inputByLabel(await this.text(key), index);
  }

  private urlRow(index: number): Locator {
    return this.page.locator('.el-row.pl-4.group').nth(index);
  }

  private urlInput(index: number): Locator {
    return this.urlRow(index).locator('.el-form-item-site-url input.el-input__inner').first();
  }

  private unlabeledFormItem(index: number): Locator {
    return this.page
      .locator('.el-form-item')
      .filter({ has: this.page.locator('.el-form-item__label').filter({ hasText: /^$/ }) })
      .nth(index);
  }

  private async fieldSelectByLabel(label: string, index = 0): Promise<Locator> {
    return (await this.labeledFormItem(label, index)).locator('.el-select__wrapper').first();
  }

  private async setSelectByLabel(label: string, text: string, index = 0) {
    const wrapper = await this.fieldSelectByLabel(label, index);
    await wrapper.scrollIntoViewIfNeeded();
    await wrapper.click({ force: true });
    await this.visibleOption(text).waitFor({ state: 'visible' });
    await this.visibleOption(text).click({ force: true });
    await this.page.waitForTimeout(300);
  }

  private async setSelect(wrapperIndex: number, text: string) {
    const wrapper = this.page.locator('.el-select__wrapper').nth(wrapperIndex);
    await wrapper.scrollIntoViewIfNeeded();
    await wrapper.click({ force: true });
    await this.visibleOption(text).waitFor({ state: 'visible' });
    await this.visibleOption(text).click({ force: true });
    await this.page.waitForTimeout(300);
  }

  private async waitForUploadToSettle() {
    await this.page.waitForTimeout(1500);
  }

  async gotoSiteList() {
    await expect(this.page.getByText(await this.text('system_management'), { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await this.sidebar.clickSubMenu('system_management', 'branch_list');
  }

  async expectSiteListVisible() {
    await expect(this.page).toHaveURL(/\/system\/branch/);
    await expect(this.page.getByText(await this.text('branch_list'), { exact: true }).last()).toBeVisible();
  }

  async clickAddSite() {
    const addButton = this.listActionButton('add');
    await addButton.click({ force: true });
  }

  async gotoAddSite() {
    await this.gotoSiteList();
    await this.clickAddSite();
  }

  async expectAddSiteVisible() {
    await expect(this.page).toHaveURL(/\/system\/branch\/add/);
    await expect(this.page.getByText(await this.text('basic_information'), { exact: true })).toBeVisible();
    await expect(await this.inputByKey('platform_name')).toBeVisible();
    await expect(await this.inputByKey('hide_code')).toBeVisible();
    await expect(this.urlInput(0)).toBeVisible();
    await expect(this.urlInput(1)).toBeVisible();
    await this.page.waitForTimeout(2000);
    await expect(this.page.locator('input[type=file]').first()).toBeAttached();
  }

  async fillRequiredBasicFields(data: {
    siteName: string;
    hiddenCode: string;
    frontendUrl: string;
    backendUrl: string;
    template?: SiteTemplate;
  }) {
    await (await this.inputByKey('platform_name')).fill(data.siteName);
    await this.selectStatus('Enable');
    await this.selectFrontendStatus('Enable');
    await this.setSelectByLabel(await this.label('regions'), await this.regionText());
    await this.setSelectByLabel(await this.label('timezone'), 'Asia/Ho_Chi_Minh');
    await this.setSelectByLabel(await this.label('info_53'), await this.localeText());
    await (await this.inputByKey('hide_code')).fill(data.hiddenCode);
    await this.setSelectByLabel(await this.label('select_version'), await this.templateText(data.template ?? 'Layout 1'));
    await this.urlInput(0).fill(data.frontendUrl);
    await this.urlInput(1).fill(data.backendUrl);
  }

  async fillSiteName(siteName: string) {
    await (await this.inputByKey('platform_name')).fill(siteName);
  }

  async selectStatus(status: 'Enable' | 'Disable') {
    await this.setSelectByLabel(await this.label('status'), await this.simpleStatusText(status));
  }

  async selectFrontendStatus(status: 'Enable' | 'Disable') {
    await this.setSelectByLabel(await this.label('foreground_status'), await this.simpleStatusText(status));
  }

  async selectRegion(region: string) {
    await this.setSelectByLabel(await this.label('regions'), region);
  }

  async openOtherRegions() {
    await this.setSelectOpenByLabel(await this.label('other_regions'));
  }

  async selectTimeZone(timeZone: string) {
    await this.setSelectByLabel(await this.label('timezone'), timeZone);
  }

  async selectPrimaryLanguage(language: string) {
    await this.setSelectByLabel(await this.label('info_53'), language);
  }

  async openOtherLanguages() {
    await this.setSelectOpenByLabel(await this.label('other_language'));
  }

  async fillHiddenCode(hiddenCode: string) {
    await (await this.inputByKey('hide_code')).fill(hiddenCode);
  }

  async fillFrontendUrl(url: string) {
    await this.urlInput(0).fill(url);
  }

  async fillBackendUrl(url: string) {
    await this.urlInput(1).fill(url);
  }

  async clickNextStep() {
    await (await this.actionButton('next_step')).click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  async expectGameSettingsVisible() {
    await expect(this.page.getByText(await this.text('game_setting'), { exact: true }).last()).toBeVisible();
  }

  async clickPreviousStep() {
    await (await this.actionButton('prev_step')).click({ force: true });
    await this.page.waitForTimeout(800);
  }

  async expectBasicInfoValues(data: {
    siteName: string;
    hiddenCode: string;
    frontendUrl: string;
    backendUrl: string;
  }) {
    await expect(await this.inputByKey('platform_name')).toHaveValue(data.siteName);
    await expect(await this.inputByKey('hide_code')).toHaveValue(data.hiddenCode);
    await expect(this.urlInput(0)).toHaveValue(data.frontendUrl);
    await expect(this.urlInput(1)).toHaveValue(data.backendUrl);
  }

  async expectGameProviderVisible(name: string) {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible();
  }

  async toggleGameProvider(name: string) {
    const row = this.page.locator('.item-row, .game-item, .provider-item, .el-row').filter({
      has: this.page.getByText(name, { exact: true }),
    }).first();

    const scopedSwitch = row.locator('.el-switch').first();
    if (await scopedSwitch.count()) {
      await scopedSwitch.click({ force: true });
      return;
    }

    await this.page
      .locator('.el-switch')
      .filter({ has: this.page.locator('..').getByText(name, { exact: true }) })
      .first()
      .click({ force: true });
  }

  firstGameSettingSwitch() {
    return this.page.locator('.el-switch').first();
  }

  async saveFromGameSettings() {
    await (await this.actionButton('enter')).click({ force: true });
  }

  async selectTemplate(template: SiteTemplate) {
    await this.setSelectByLabel(await this.label('select_version'), await this.templateText(template));
  }

  private async setSelectOpen(wrapperIndex: number) {
    const wrapper = this.page.locator('.el-select__wrapper').nth(wrapperIndex);
    await wrapper.scrollIntoViewIfNeeded();
    await wrapper.click({ force: true });
    await this.page.waitForTimeout(300);
  }

  private async setSelectOpenByLabel(label: string, index = 0) {
    const wrapper = await this.fieldSelectByLabel(label, index);
    await wrapper.scrollIntoViewIfNeeded();
    await wrapper.click({ force: true });
    await this.page.waitForTimeout(300);
  }

  async uploadSiteLogoWeb(filePath: string) {
    await this.uploadInput(0).setInputFiles(filePath);
    await this.waitForUploadToSettle();
  }

  async uploadSiteLogoH5(filePath: string) {
    await this.uploadInput(1).setInputFiles(filePath);
    await this.waitForUploadToSettle();
  }

  async uploadFrontendFavicon(filePath: string) {
    await this.uploadInput(2).setInputFiles(filePath);
    await this.waitForUploadToSettle();
  }

  async uploadBackendFavicon(filePath: string) {
    await this.uploadInput(3).setInputFiles(filePath);
    await this.waitForUploadToSettle();
  }

  async expectLatestAlertContains(message: string | RegExp) {
    const deadline = Date.now() + 5000;

    while (Date.now() < deadline) {
      const texts = ((await this.page.locator('.el-message, [role="alert"]').allTextContents()) ?? []).map(
        (text) => text.trim()
      );

      const matched = texts.some((text) =>
        typeof message === 'string' ? text.includes(message) : message.test(text)
      );

      if (matched) {
        return;
      }

      await this.page.waitForTimeout(200);
    }

    const actualTexts = ((await this.page.locator('.el-message, [role="alert"]').allTextContents()) ?? []).map(
      (text) => text.trim()
    );

    expect(actualTexts).toEqual(
      expect.arrayContaining([typeof message === 'string' ? expect.stringContaining(message) : expect.stringMatching(message)])
    );
  }

  async expectNoVisibleAlerts() {
    await expect(this.page.locator('.el-message, [role="alert"]')).toHaveCount(0);
  }

  async expectFieldError(label: string, message: string, index = 0) {
    await expect((await this.labeledFormItem(label, index)).locator('.el-form-item__error')).toHaveText(message);
  }

  async expectFieldErrorByKey(labelKey: string, messageKey: string, index = 0) {
    await this.expectFieldError(await this.label(labelKey), await this.copy(messageKey), index);
  }

  async expectUnlabeledFieldError(index: number, message: string) {
    await expect(this.unlabeledFormItem(index).locator('.el-form-item__error')).toHaveText(message);
  }

  async expectErrorTextCount(message: string, count: number) {
    await expect(this.page.locator('.el-form-item__error').filter({ hasText: message })).toHaveCount(count);
  }

  async expectErrorTextCountByKey(messageKey: string, count: number) {
    await this.expectErrorTextCount(await this.copy(messageKey), count);
  }

  async expectAnyErrorText(message: string) {
    await expect(this.page.locator('.el-form-item__error').filter({ hasText: message }).first()).toBeVisible();
  }

  async expectAnyErrorTextByKey(messageKey: string, vars?: Record<string, string | number>) {
    await this.expectAnyErrorText(await this.copy(messageKey, 'backend', vars));
  }

  async expectFieldErrorMatches(label: string, pattern: RegExp, index = 0) {
    await expect((await this.labeledFormItem(label, index)).locator('.el-form-item__error')).toHaveText(pattern);
  }

  async expectOptionVisible(text: string) {
    await expect(this.visibleOption(text)).toBeVisible();
  }

  async expectOptionNotVisible(text: string) {
    await expect(this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({ hasText: text })).toHaveCount(0);
  }

  async closeSelectDropdown() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);
  }

  async completeMinimalCreateFlow(data: {
    siteName: string;
    hiddenCode: string;
    frontendUrl: string;
    backendUrl: string;
    template?: SiteTemplate;
    webLogoPath: string;
    h5LogoPath: string;
  }) {
    await this.fillRequiredBasicFields(data);
    await this.uploadSiteLogoH5(data.h5LogoPath);
    await this.uploadSiteLogoWeb(data.webLogoPath);
    await this.clickNextStep();
    await this.expectGameSettingsVisible();
    await (await this.actionButton('enter')).click({ force: true });
  }

  async expectCreateSuccessAndReturnToList() {
    await expect(this.page).toHaveURL(/\/system\/branch$/);
    await expect(this.topListRow()).toBeVisible();
  }

  async waitForToastToDisappear() {
    await this.page.waitForTimeout(3200);
  }

  listRowBySiteName(siteName: string): Locator {
    return this.page.locator('tr.el-table__row').filter({
      has: this.page.locator('td .cell', { hasText: siteName }),
    }).first();
  }

  topListRow(): Locator {
    return this.page.locator('tr.el-table__row').first();
  }

  async topRowTexts(): Promise<string[]> {
    const cells = this.topListRow().locator('td .cell');
    return (await cells.allTextContents()).map((text) => text.trim());
  }

  async rowTextsBySiteName(siteName: string): Promise<string[]> {
    const cells = this.listRowBySiteName(siteName).locator('td .cell');
    return (await cells.allTextContents()).map((text) => text.trim());
  }

  async topSiteName(): Promise<string> {
    return (await this.topListRow().locator('td .cell').first().textContent())?.trim() ?? '';
  }

  async expectTopRowContains(text: string) {
    await expect(this.topListRow()).toContainText(text);
  }

  async clickEditTopRow() {
    const editButton = this.topListRow().locator('td').last().locator('.cell > div > div').first();
    await editButton.click({ force: true });
  }

  async clickEditRowBySiteName(siteName: string) {
    const row = this.listRowBySiteName(siteName);
    const editButton = row.locator('td').last().locator('.bg-mainBlue.el-tooltip__trigger').first();

    if (await editButton.count()) {
      await editButton.hover();
      await editButton.click();
      await this.page.waitForTimeout(500);
      return;
    }

    const fallbackButton = row.locator('td').last().locator('.cell > div > div').first();
    await fallbackButton.hover();
    await fallbackButton.click();
    await this.page.waitForTimeout(500);
  }

  async expectEditSiteVisible() {
    await expect(this.page).toHaveURL(/\/system\/branch\/edit\?id=/);
    await expect(this.page.getByText(await this.text('basic_information'), { exact: true })).toBeVisible();
  }

  async expectEditFieldStates() {
    await expect(await this.inputByKey('hide_code')).toBeDisabled();
    await expect(await this.fieldSelectByLabel(await this.label('info_53'))).toHaveClass(/is-disabled/);
    await expect(this.urlRow(0).locator('.el-select__wrapper')).toHaveClass(/is-disabled/);
    await expect(this.urlRow(1).locator('.el-select__wrapper')).toHaveClass(/is-disabled/);
  }

  async expectEditFieldEditability() {
    await expect(await this.inputByKey('platform_name')).toBeEnabled();
    await expect(await this.inputByKey('hide_code')).toBeDisabled();
    await expect(this.urlInput(0)).toBeEnabled();
    await expect(this.urlInput(1)).toBeEnabled();

    const primaryLanguageForm = await this.labeledFormItemByKey('info_53');
    await expect(primaryLanguageForm.locator('.el-select__wrapper')).toHaveClass(/is-disabled/);

    const statusForm = await this.labeledFormItemByKey('status');
    const frontendStatusForm = await this.labeledFormItemByKey('foreground_status');
    const regionForm = await this.labeledFormItemByKey('regions');
    const timeZoneForm = await this.labeledFormItemByKey('timezone');

    await expect(statusForm.locator('.el-select__wrapper')).not.toHaveClass(/is-disabled/);
    await expect(frontendStatusForm.locator('.el-select__wrapper')).not.toHaveClass(/is-disabled/);
    await expect(regionForm.locator('.el-select__wrapper')).not.toHaveClass(/is-disabled/);
    await expect(timeZoneForm.locator('.el-select__wrapper')).not.toHaveClass(/is-disabled/);
  }

  async fillEditBasicFields(data: {
    siteName?: string;
    status?: 'Enable' | 'Disable';
    frontendStatus?: 'Enable' | 'Disable';
    region?: string;
    timeZone?: string;
    frontendUrl?: string;
    backendUrl?: string;
  }) {
    if (data.siteName !== undefined) {
      await (await this.inputByKey('platform_name')).fill(data.siteName);
    }

    if (data.status !== undefined) {
      await this.setSelectByLabel(await this.label('status'), data.status);
    }

    if (data.frontendStatus !== undefined) {
      await this.setSelectByLabel(await this.label('foreground_status'), data.frontendStatus);
    }

    if (data.region !== undefined) {
      await this.setSelectByLabel(await this.label('regions'), data.region);
    }

    if (data.timeZone !== undefined) {
      await this.setSelectByLabel(await this.label('timezone'), data.timeZone);
    }

    if (data.frontendUrl !== undefined) {
      await this.urlInput(0).fill(data.frontendUrl);
    }

    if (data.backendUrl !== undefined) {
      await this.urlInput(1).fill(data.backendUrl);
    }
  }

  async saveEdit() {
    await (await this.actionButton('enter')).click({ force: true });
  }

  async editFieldValues() {
    return {
      siteName: await (await this.inputByKey('platform_name')).inputValue(),
      hiddenCode: await (await this.inputByKey('hide_code')).inputValue(),
      frontendUrl: await this.urlInput(0).inputValue(),
      backendUrl: await this.urlInput(1).inputValue(),
    };
  }

  async expectSearchShowsSite(siteName: string) {
    await expect(this.listRowBySiteName(siteName)).toBeVisible();
  }

  async fillSearchKeyword(keyword: string) {
    await this.filterBox.locator('input.el-input__inner').fill(keyword);
  }

  async clickSearch() {
    await this.filterButton('search').click({ force: true });
  }

  async clickReset() {
    await this.filterButton('reset').click({ force: true });
  }

  async searchSite(siteName: string) {
    await this.fillSearchKeyword(siteName);
    await this.clickSearch();
  }

  async selectFilterRegion(region: string) {
    const wrapper = this.filterBox.locator('.el-select__wrapper').first();
    await wrapper.scrollIntoViewIfNeeded();
    await wrapper.click({ force: true });
    await this.visibleOption(region).waitFor({ state: 'visible' });
    await this.visibleOption(region).click({ force: true });
    await this.page.waitForTimeout(300);
  }

  async selectFilterStatus(status: 'Enable' | 'Disable') {
    const wrapper = this.filterBox.locator('.el-select__wrapper').nth(1);
    const optionText = await this.filterStatusText(status);
    await wrapper.scrollIntoViewIfNeeded();
    await wrapper.click({ force: true });
    await this.visibleOption(optionText).waitFor({ state: 'visible' });
    await this.visibleOption(optionText).click({ force: true });
    await this.page.waitForTimeout(300);
  }

  async expectNoData() {
    await expect(this.listBox).toContainText(await this.text('no_data'));
  }

  async expectSearchInputEmpty() {
    await expect(this.filterBox.locator('input.el-input__inner')).toHaveValue('');
  }

  async toggleTopRowBackOfficeStatus() {
    await this.topListRow().locator('.el-switch').first().evaluate((el) => el.click());
  }

  async toggleTopRowFrontendStatus() {
    await this.topListRow().locator('.el-switch').nth(1).evaluate((el) => el.click());
  }

  async toggleRowBackOfficeStatus(siteName: string) {
    await this.listRowBySiteName(siteName).locator('.el-switch').first().evaluate((el) => el.click());
  }

  async toggleRowFrontendStatus(siteName: string) {
    await this.listRowBySiteName(siteName).locator('.el-switch').nth(1).evaluate((el) => el.click());
  }
}
