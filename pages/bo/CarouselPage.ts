import { expect, Locator, Page } from '@playwright/test';
import { BOI18n } from '../../utils/i18n';
import { waitForAlertOrIdle, waitForNetworkSettled, waitForUiSettled, waitForVisibleSelectOptions } from './CommonPage';
import { BOSidebarPage } from './SidebarPage';

export type CarouselLinkType = 'Hyperlink' | 'SpecificGame' | 'None';
export type CarouselLinkTarget = 'SameTab' | 'NewTab';
export type CarouselTimeMode = 'Other' | 'Permanent';
export type CarouselArchiveStatus = 'Publish' | 'Schedule' | 'Unpublish';

export class BOCarouselPage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  readonly pageInfoBox: Locator;
  readonly listBox: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.pageInfoBox = page.locator('.page-box').first();
    this.listBox = page.locator('.page-box').nth(1);
    this.i18n = new BOI18n(page);
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

  async copy(
    key: string,
    namespace: 'backend' | 'frontend' | 'error_code' = 'backend',
    vars?: Record<string, string | number>
  ): Promise<string> {
    return this.format(await this.i18n.t(key, namespace), vars);
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

  private toolbar(): Locator {
    return this.listBox.locator('.flex.items-center.justify-between.w-full.mb-3.gap-2').first();
  }

  private archiveFilterButton(status: CarouselArchiveStatus): Locator {
    const index = {
      Publish: 0,
      Schedule: 1,
      Unpublish: 2,
    }[status];

    return this.listBox.locator('button').nth(index);
  }

  private tableHeader(text: string): Locator {
    return this.listBox.locator('th').filter({ hasText: text }).first();
  }

  private listSiteSelect(): Locator {
    return this.pageInfoBox.locator('.el-select__wrapper').first();
  }

  private dialog(): Locator {
    return this.page
      .locator('.el-dialog:visible')
      .filter({ has: this.page.locator('.el-radio input[type=radio]') })
      .last();
  }

  private confirmDialogPanel(): Locator {
    return this.page
      .locator('.el-dialog:visible')
      .filter({ hasNot: this.page.locator('.el-radio input[type=radio]') })
      .last();
  }

  private dialogFooterButton(index: number): Locator {
    return this.dialog().locator('.el-dialog__footer button').nth(index);
  }

  private tableRows(): Locator {
    return this.listBox.locator('tbody tr');
  }

  firstRow(): Locator {
    return this.tableRows().first();
  }

  private visibleOptions(): Locator {
    return this.page
      .locator('.el-select-dropdown:visible')
      .last()
      .locator('.el-select-dropdown__item:not(.is-disabled)');
  }

  private visibleOption(text: string): Locator {
    return this.visibleOptions().filter({ hasText: text }).first();
  }

  private async openSelectUntilOptionsVisible(wrapper: Locator) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await wrapper.scrollIntoViewIfNeeded();
      await wrapper.click({ force: true });

      const visible = await this.visibleOptions().first().isVisible({ timeout: 800 }).catch(() => false);
      if (visible) {
        return;
      }

      await waitForUiSettled(this.page, 250);
    }

    await waitForVisibleSelectOptions(this.page);
  }

  private async selectVisibleOption(text: string) {
    await waitForVisibleSelectOptions(this.page);
    await this.visibleOption(text).click({ force: true });
    await waitForUiSettled(this.page);
  }

  private async chooseFirstVisibleOption(): Promise<string> {
    await waitForVisibleSelectOptions(this.page);
    const option = this.visibleOptions().first();
    const text = (await option.textContent())?.trim() ?? '';
    await option.click({ force: true });
    await waitForUiSettled(this.page);
    return text;
  }

  private async clickRadioByIndex(index: number) {
    const radio = this.dialog().locator('.el-radio input[type=radio]').nth(index);
    await radio.scrollIntoViewIfNeeded();
    await radio.evaluate((element: HTMLInputElement) => element.click());
    await waitForUiSettled(this.page);
  }

  private async clickRadioByText(text: string) {
    const radio = this.dialog()
      .locator('.el-radio')
      .filter({ hasText: text })
      .first()
      .locator('input[type=radio]')
      .first();

    await radio.scrollIntoViewIfNeeded();
    await radio.evaluate((element: HTMLInputElement) => element.click());
    await waitForUiSettled(this.page);
  }

  private async dialogFormItemByLabel(label: string): Promise<Locator> {
    return this.dialog()
      .locator('.el-form-item')
      .filter({
        has: this.dialog().locator('.el-form-item__label').filter({ hasText: label }),
      })
      .first();
  }

  private dialogTextInput(index: number): Locator {
    return this.dialog().locator('input.el-input__inner').nth(index);
  }

  private startTimeInput(): Locator {
    return this.dialog().locator('.el-date-editor input.el-input__inner').first();
  }

  private hyperlinkInput(): Locator {
    return this.dialog()
      .locator('.el-form-item')
      .filter({ has: this.dialog().getByText('https://', { exact: true }) })
      .locator('input.el-input__inner')
      .first();
  }

  private async resolvedHyperlinkInput(): Promise<Locator> {
    const textbox = this.dialog().getByRole('textbox').first();
    const textboxVisible = await textbox.isVisible({ timeout: 800 }).catch(() => false);
    if (textboxVisible) {
      return textbox;
    }

    const hyperlinkInput = this.hyperlinkInput();
    const matched = await hyperlinkInput.isVisible({ timeout: 800 }).catch(() => false);

    if (matched) {
      return hyperlinkInput;
    }

    return this.dialog().locator('input.el-input__inner').first();
  }

  private dialogFileInput(index: number): Locator {
    return this.dialog().locator('input[type=file]').nth(index);
  }

  private async waitForUploadToSettle() {
    await waitForAlertOrIdle(this.page, 1000);
  }

  private async closeTransientPanels() {
    const pickerVisible = await this.page.locator('.el-picker-panel:visible').count();
    const selectVisible = await this.page.locator('.el-select-dropdown:visible').count();

    if (pickerVisible > 0 || selectVisible > 0) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await waitForUiSettled(this.page, 300);
    }
  }

  async gotoCarouselList() {
    await expect(this.page.getByText(await this.text('website_setting'), { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await this.sidebar.clickSubMenu('website_setting', 'carousel');
  }

  async expectCarouselListVisible() {
    await expect(this.page).toHaveURL(/\/setting\/carousel/);
    await expect(this.page.getByText(await this.text('carousel'), { exact: true }).last()).toBeVisible();
    await expect(this.listSiteSelect()).toBeVisible();
  }

  async selectListSite(index = 0): Promise<string> {
    const wrapper = this.listSiteSelect();
    await this.openSelectUntilOptionsVisible(wrapper);

    const optionVisible = await this.visibleOptions().first().isVisible({ timeout: 1000 }).catch(() => false);
    const selectedText = optionVisible
      ? await this.chooseFirstVisibleOptionByIndex(index)
      : ((await wrapper.textContent())?.trim() ?? '');

    await waitForNetworkSettled(this.page);
    return selectedText;
  }

  async selectListSiteByName(name: string): Promise<string> {
    const wrapper = this.listSiteSelect();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.openSelectUntilOptionsVisible(wrapper);
      await this.selectVisibleOption(name);
      await waitForNetworkSettled(this.page);

      const selected = await wrapper.textContent();
      if (selected?.includes(name)) {
        return name;
      }
    }

    await expect(wrapper).toContainText(name);
    return name;
  }

  async clickArchiveFilter(status: CarouselArchiveStatus) {
    const button = this.archiveFilterButton(status);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await button.click({ force: true });
      await waitForNetworkSettled(this.page, 800);

      const selected = await button.getAttribute('class');
      if (selected?.includes('btn-blue')) {
        return;
      }
    }

    await expect(button).toHaveClass(/btn-blue/);
  }

  async expectCurrentViewContains(text: string) {
    await expect(this.listBox).toContainText(text);
  }

  private async chooseFirstVisibleOptionByIndex(index = 0): Promise<string> {
    await waitForVisibleSelectOptions(this.page);
    const option = this.visibleOptions().nth(index);
    const text = (await option.textContent())?.trim() ?? '';
    await option.click({ force: true });
    await waitForUiSettled(this.page);
    return text;
  }

  async expectDefaultListVisible() {
    await expect(this.toolbar().locator('button')).toHaveCount(2);
    await expect(this.listBox).toContainText(await this.copy('info_48'));
    await expect(this.tableHeader(await this.copy('image'))).toBeVisible();
    await expect(this.tableHeader(await this.copy('start_time'))).toBeVisible();
    await expect(this.tableHeader(await this.copy('end_time'))).toBeVisible();
    await expect(this.tableHeader(await this.copy('display_status'))).toBeVisible();
    await expect(this.listBox.getByText(await this.copy('search_banner_status_type_1'), { exact: true })).toBeVisible();
    await expect(this.listBox.getByText(await this.copy('search_banner_status_type_2'), { exact: true })).toBeVisible();
    await expect(this.listBox.getByText(await this.copy('search_banner_status_type_0'), { exact: true })).toBeVisible();
  }

  async openAddDialog() {
    const addButton = this.toolbar().locator('button').first();
    await expect(addButton).toBeEnabled();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await addButton.click({ force: true });

      const opened = await this.dialog().isVisible({ timeout: 1500 }).catch(() => false);
      if (opened) {
        break;
      }

      await waitForUiSettled(this.page, 300);
    }

    await this.expectAddDialogVisible();
  }

  async expectAddDialogVisible() {
    await expect(this.dialog()).toBeVisible();
    await expect(this.dialog().getByText(await this.copy('add_banner'), { exact: true })).toBeVisible();
    await expect(this.dialog().locator('.el-dialog__footer button')).toHaveCount(2);
  }

  async cancelAddDialog() {
    await this.dialogFooterButton(0).click({ force: true });
    await this.expectAddDialogClosed();
  }

  async confirmAddDialog() {
    await this.dialogFooterButton(1).click({ force: true });
    await waitForUiSettled(this.page, 300);
  }

  async expectAddDialogClosed() {
    await expect(this.page.locator('.el-dialog:visible')).toHaveCount(0);
  }

  async selectDialogSiteByName(name: string) {
    const wrapper = this.dialog().locator('.el-select__wrapper').first();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.openSelectUntilOptionsVisible(wrapper);
      await this.selectVisibleOption(name);

      const selected = await wrapper.textContent();
      if (selected?.includes(name)) {
        return;
      }
    }

    await expect(wrapper).toContainText(name);
  }

  async selectFirstDialogSite(): Promise<string> {
    const wrapper = this.dialog().locator('.el-select__wrapper').first();
    await this.openSelectUntilOptionsVisible(wrapper);
    return this.chooseFirstVisibleOption();
  }

  async chooseLinkType(type: CarouselLinkType) {
    const index = {
      Hyperlink: 0,
      SpecificGame: 1,
      None: 2,
    }[type];

    await this.clickRadioByIndex(index);

    if (type === 'SpecificGame') {
      await expect(this.dialog().locator('.el-select__wrapper')).toHaveCount(4);
    }
  }

  async chooseHyperlinkTarget(target: CarouselLinkTarget) {
    await this.clickRadioByText(
      await this.copy(target === 'SameTab' ? 'jump_same_page' : 'new_page')
    );
  }

  async chooseTimeMode(mode: CarouselTimeMode) {
    await this.clickRadioByText(await this.copy(mode === 'Other' ? 'other' : 'permanent'));
  }

  async expectHyperlinkFieldsVisible() {
    await expect(this.dialog().getByText('https://', { exact: true })).toBeVisible();
    await expect(this.dialog().locator('.el-radio').nth(3)).toContainText(await this.copy('jump_same_page'));
    await expect(this.dialog().locator('.el-radio').nth(4)).toContainText(await this.copy('new_page'));
  }

  async fillHyperlink(url: string) {
    const input = await this.resolvedHyperlinkInput();
    await input.click({ force: true });
    await input.press('Control+A');
    await input.fill(url);
    await expect(input).toHaveValue(url);
    await input.evaluate((element: HTMLInputElement) => {
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
    });
    await waitForUiSettled(this.page);
  }

  async fillStartTime(value: string) {
    const input = this.startTimeInput();
    await input.click({ force: true });
    await input.press('Control+A');
    await input.fill(value);
    await expect(input).toHaveValue(value);

    const okButton = this.page.locator('.el-picker-panel:visible button').filter({ hasText: /OK|确定/i }).last();
    const okVisible = await okButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (okVisible) {
      await okButton.click({ force: true });
    } else {
      await input.press('Enter').catch(() => undefined);
      await input.blur();
    }

    await this.closeTransientPanels();
    await waitForUiSettled(this.page);
  }

  async currentStartTimeValue(): Promise<string> {
    return (await this.startTimeInput().inputValue()).trim();
  }

  async fillEditHyperlink(url: string) {
    await this.fillHyperlink(url);
  }

  async expectSpecificGameFieldsVisible() {
    await expect(this.dialog().locator('.el-form-item__label').filter({ hasText: await this.copy('game_provider') })).toBeVisible();
    await expect(this.dialog().locator('.el-form-item__label').filter({ hasText: await this.copy('game_type') })).toBeVisible();
    await expect(this.dialog().locator('.el-form-item__label').filter({ hasText: await this.copy('game_name') })).toBeVisible();
  }

  async expectRequiredErrorCount(count: number) {
    const requiredText = await this.copy('required_field');
    await expect(this.dialog().locator('.el-form-item__error').filter({ hasText: requiredText }).first()).toBeVisible();
    await expect(this.dialog().locator('.el-form-item__error').filter({ hasText: requiredText })).toHaveCount(count);
  }

  async expectAnyErrorTextByKey(
    key: string,
    namespace: 'backend' | 'frontend' | 'error_code' = 'backend',
    vars?: Record<string, string | number>
  ) {
    await expect(
      this.dialog()
        .locator('.el-form-item__error')
        .filter({ hasText: await this.copy(key, namespace, vars) })
        .first()
    ).toBeVisible();
  }

  async expectEndTimeDisabled() {
    await expect(this.dialog().getByRole('combobox', { name: await this.copy('end_time') })).toBeDisabled();
  }

  async waitForImageUploadsReady() {
    await expect(this.dialogFileInput(0)).toBeAttached();
    await expect(this.dialogFileInput(1)).toBeAttached();
  }

  async uploadWebImage(filePath: string) {
    await this.dialogFileInput(0).setInputFiles(filePath);
    await this.waitForUploadToSettle();
  }

  async uploadInitialH5Image(filePath: string) {
    await this.dialogFileInput(1).setInputFiles(filePath);
    await this.waitForUploadToSettle();
  }

  async uploadH5Image(filePath: string) {
    await this.dialog().locator('input[type=file]').first().setInputFiles(filePath);
    await this.waitForUploadToSettle();
  }

  async uploadPrimaryLanguageImages(webPath: string, h5Path: string) {
    await this.waitForImageUploadsReady();
    await this.uploadWebImage(webPath);
    await this.uploadH5Image(h5Path);
  }

  async chooseFirstGameProvider(): Promise<string> {
    const wrapper = this.dialog().locator('.el-select__wrapper').nth(1);
    await this.openSelectUntilOptionsVisible(wrapper);
    const text = await this.chooseFirstVisibleOption();
    await expect(wrapper).toContainText(text);
    await waitForNetworkSettled(this.page, 600);
    return text;
  }

  async chooseFirstGameType(): Promise<string> {
    const wrapper = this.dialog().locator('.el-select__wrapper').nth(2);
    await this.openSelectUntilOptionsVisible(wrapper);

    const options = this.visibleOptions();
    await expect.poll(async () => options.count()).toBeGreaterThan(0);

    const text = ((await options.first().textContent()) ?? '').trim();
    await options.first().click({ force: true });
    const clicked = await wrapper.isVisible({ timeout: 200 }).catch(() => false);
    if (clicked) {
      const selectedByClick = await wrapper.textContent();
      if (selectedByClick?.includes(text)) {
        await waitForNetworkSettled(this.page, 600);
        return text;
      }
    }

    await this.openSelectUntilOptionsVisible(wrapper);
    await wrapper.click({ force: true });
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
    await expect(wrapper).toContainText(text);
    await waitForNetworkSettled(this.page, 600);
    return text;
  }

  async expectRowByTextContains(text: string, expected: string) {
    await expect(this.rowByText(text)).toContainText(expected);
  }

  async expectFirstRowContains(text: string) {
    await expect(this.firstRow()).toContainText(text);
  }

  async chooseFirstGameName(): Promise<string> {
    const wrapper = this.dialog().locator('.el-select__wrapper').nth(3);
    await this.openSelectUntilOptionsVisible(wrapper);

    const options = this.visibleOptions();
    await expect.poll(async () => options.count()).toBeGreaterThan(0);

    const text = ((await options.first().textContent()) ?? '').trim();
    const input = wrapper.locator('input').first();
    await input.focus();
    await input.press('ArrowDown');
    await input.press('Enter');
    await waitForUiSettled(this.page, 1200);
    return text;
  }

  async submitAddDialogAndWaitForCreate() {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.closeTransientPanels();

      const responsePromise = this.page.waitForResponse(async (response) => {
        if (!response.url().includes('/api/v0/advertisement/banner/create')) {
          return false;
        }

        if (response.request().method() !== 'POST' || response.status() !== 200) {
          return false;
        }

        const body = await response.json().catch(() => null);
        return body?.success === true;
      }, { timeout: 5000 }).catch(() => null);

      await this.dialogFooterButton(1).click({ force: true });
      const response = await responsePromise;

      if (response) {
        await this.expectAddDialogClosed();
        await waitForNetworkSettled(this.page, 1000);
        return;
      }

      await waitForUiSettled(this.page, 500);
    }

    throw new Error(`Create banner request was not sent. Dialog errors: ${(await this.dialog().locator('.el-form-item__error').allTextContents()).join(' | ')}`);
  }

  async submitEditDialogAndWaitForUpdate() {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.closeTransientPanels();

      const responsePromise = this.page.waitForResponse(async (response) => {
        if (!response.url().includes('/api/v0/advertisement/banner/update/')) {
          return false;
        }

        if (response.request().method() !== 'PUT' || response.status() !== 200) {
          return false;
        }

        const body = await response.json().catch(() => null);
        return body?.success === true;
      }, { timeout: 5000 }).catch(() => null);

      await this.dialogFooterButton(1).click({ force: true });
      const response = await responsePromise;

      if (response) {
        await this.expectAddDialogClosed();
        await waitForNetworkSettled(this.page, 1000);
        return;
      }

      await waitForUiSettled(this.page, 500);
    }

    throw new Error(`Update banner request was not sent. Dialog errors: ${(await this.dialog().locator('.el-form-item__error').allTextContents()).join(' | ')}`);
  }

  async confirmInactiveAndWaitForStatusChange() {
    const responsePromise = this.page.waitForResponse(async (response) => {
      if (!response.url().includes('/api/v0/advertisement/banner/modify-status/')) {
        return false;
      }

      if (response.request().method() !== 'PUT' || response.status() !== 200) {
        return false;
      }

      const body = await response.json().catch(() => null);
      return body?.success === true;
    });

    await this.confirmDialogPanel().locator('.el-dialog__footer button').nth(1).click({ force: true });
    await responsePromise;
    await expect(this.confirmDialogPanel()).toHaveCount(0);
    await waitForNetworkSettled(this.page, 1000);
  }

  async confirmDeletionAndWaitForDelete() {
    const responsePromise = this.page.waitForResponse(async (response) => {
      if (!response.url().includes('/api/v0/advertisement/banner/delete/')) {
        return false;
      }

      if (response.request().method() !== 'DELETE' || response.status() !== 200) {
        return false;
      }

      const body = await response.json().catch(() => null);
      return body?.success === true;
    });

    await this.confirmDialogPanel().locator('.el-dialog__footer button').nth(1).click({ force: true });
    await responsePromise;
    await expect(this.confirmDialogPanel()).toHaveCount(0);
    await waitForNetworkSettled(this.page, 1000);
  }

  rowByText(text: string): Locator {
    return this.tableRows().filter({ hasText: text }).first();
  }

  rowByTexts(texts: string[]): Locator {
    return texts.reduce((row, text) => row.filter({ hasText: text }), this.tableRows()).first();
  }

  async expectRowVisibleByText(text: string) {
    await expect
      .poll(async () => this.rowByText(text).count(), { timeout: 20000 })
      .toBeGreaterThan(0);
  }

  async expectRowVisibleByTexts(texts: string[]) {
    await expect
      .poll(async () => this.rowByTexts(texts).count(), { timeout: 20000 })
      .toBeGreaterThan(0);
  }

  async expectRowNotVisibleByText(text: string) {
    await expect.poll(async () => this.rowByText(text).count(), { timeout: 20000 }).toBe(0);
  }

  async openEditRowByText(text: string) {
    await this.expectRowVisibleByText(text);
    await this.rowByText(text).locator('.bg-mainBlue').first().click({ force: true });
    await this.expectDialogTitle('edit_banner');
  }

  async clickLowerRowByText(text: string) {
    await this.expectRowVisibleByText(text);
    await this.rowByText(text).locator('.bg-notice').first().click({ force: true });
  }

  async expectDialogTitle(key: 'add_banner' | 'edit_banner' | 'confirm_inactive') {
    await expect(this.dialog().getByText(await this.copy(key), { exact: true })).toBeVisible();
  }

  async expectConfirmInactiveDialog() {
    await expect(this.confirmDialogPanel()).toContainText(await this.copy('confirm_inactive_again'));
  }

  async expectConfirmDeletionDialog() {
    await expect(this.confirmDialogPanel()).toContainText(await this.copy('confirm_deletion_again'));
  }

  async confirmDialog() {
    await this.dialogFooterButton(1).click({ force: true });
    await waitForNetworkSettled(this.page, 800);
  }

  async expectLatestAlertContainsKey(
    key: string,
    namespace: 'backend' | 'frontend' | 'error_code' = 'backend',
    vars?: Record<string, string | number>
  ) {
    await this.expectLatestAlertContains(await this.copy(key, namespace, vars));
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
}
