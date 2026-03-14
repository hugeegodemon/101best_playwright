import { expect, Locator, Page } from '@playwright/test';
import { BOI18n } from '../../utils/i18n';
import { waitForNetworkSettled, waitForUiSettled, waitForVisibleSelectOptions } from './CommonPage';
import { BOSidebarPage } from './SidebarPage';

export type PromotionTypeCreateTransaction = {
  requestBody: unknown;
  responseBody: unknown;
};

export type PromotionTypeUpdateTransaction = {
  requestBody: unknown;
  responseBody: unknown;
};

export type PromotionTypeSortTransaction = {
  requestBody: unknown;
  responseBody: unknown;
};

export class BOPromotionPage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.i18n = new BOI18n(page);
  }

  private async text(key: string): Promise<string> {
    return this.i18n.t(key);
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private rootTabs(): Locator {
    return this.page.locator('.el-tabs').first();
  }

  private categoryDialog(): Locator {
    return this.page
      .locator('.el-dialog:visible')
      .filter({ has: this.page.getByText('Add Category Name', { exact: true }) })
      .last();
  }

  private editCategoryDialog(): Locator {
    return this.page
      .locator('.el-dialog:visible')
      .filter({ has: this.page.getByText('Edit Category Name', { exact: true }) })
      .last();
  }

  private colorSettingDialog(): Locator {
    return this.page
      .locator('.el-dialog:visible')
      .filter({ has: this.page.getByText('Color Setting', { exact: true }) })
      .last();
  }

  private activePane(): Locator {
    return this.rootTabs().locator('.el-tab-pane[aria-hidden="false"]').first();
  }

  private addPromotionDialog(): Locator {
    return this.page
      .locator('.el-dialog:visible')
      .filter({ has: this.page.getByText('Add Promotion', { exact: true }) })
      .last();
  }

  private tabByText(text: string): Locator {
    return this.rootTabs().locator('.el-tabs__item').filter({ hasText: text }).first();
  }

  private categoryTab(): Locator {
    return this.tabByText('Category');
  }

  private settingsTab(): Locator {
    return this.tabByText('Promotion Settings');
  }

  private paneSelect(index: number): Locator {
    return this.activePane().locator('.el-select__wrapper').nth(index);
  }

  private categoryDialogFooterButton(index: number): Locator {
    return this.categoryDialog().locator('.el-dialog__footer button').nth(index);
  }

  private addPromotionDialogFooterButton(index: number): Locator {
    return this.addPromotionDialog().locator('.el-dialog__footer button').nth(index);
  }

  private editCategoryDialogFooterButton(index: number): Locator {
    return this.editCategoryDialog().locator('.el-dialog__footer button').nth(index);
  }

  private categoryDialogSiteSelect(): Locator {
    return this.categoryDialog().locator('.el-select__wrapper').first();
  }

  private addPromotionDialogSiteSelect(): Locator {
    return this.addPromotionDialog().locator('.el-select__wrapper').first();
  }

  private addPromotionDialogCategorySelect(): Locator {
    return this.addPromotionDialog().locator('.el-select__wrapper').nth(1);
  }

  private activeTable(): Locator {
    return this.activePane().locator('.el-table').first();
  }

  private categoryAddButton(): Locator {
    return this.activePane().locator('button').first();
  }

  private categorySortToggleButton(): Locator {
    return this.activePane().locator('button.btn-default').last();
  }

  private categorySortCancelButton(): Locator {
    return this.activePane().locator('button.btn-blue.flex-1').last();
  }

  private categorySortSaveButton(): Locator {
    return this.activePane().locator('button.btn-primary.flex-1').last();
  }

  private activeTableHeader(text: string): Locator {
    return this.activeTable().locator('th').filter({ hasText: text }).first();
  }

  private activeTableHeaders(): Locator {
    return this.activeTable().locator('th');
  }

  private categoryRows(): Locator {
    return this.activeTable().locator('tbody tr');
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

  private categoryRowByText(text: string): Locator {
    return this.categoryRows().filter({ hasText: text }).first();
  }

  private async waitForPromotionTypeMutation(
    urlPart: string,
    method: 'POST' | 'PUT' | 'DELETE',
    timeout = 5000
  ) {
    const response = await this.page.waitForResponse(
      async (candidate) =>
        candidate.url().includes(urlPart) &&
        candidate.request().method() === method &&
        candidate.status() === 200,
      { timeout }
    );

    return response.json().catch(() => null);
  }

  private async waitForPromotionTypeCreateRequest(timeout = 5000) {
    const request = await this.page.waitForRequest(
      (candidate) =>
        candidate.url().includes('/api/v0/promotion-type/create') &&
        candidate.method() === 'POST',
      { timeout }
    );

    try {
      return request.postDataJSON();
    } catch {
      return request.postData() ?? null;
    }
  }

  private async waitForPromotionTypeUpdateRequest(timeout = 5000) {
    const request = await this.page.waitForRequest(
      (candidate) =>
        candidate.url().includes('/api/v0/promotion-type/update/') &&
        candidate.method() === 'PUT',
      { timeout }
    );

    try {
      return request.postDataJSON();
    } catch {
      return request.postData() ?? null;
    }
  }

  private async waitForPromotionTypeSortRequest(timeout = 5000) {
    const request = await this.page.waitForRequest(
      (candidate) =>
        candidate.url().includes('/api/v0/promotion-type/sort') &&
        candidate.method() === 'PUT',
      { timeout }
    );

    try {
      return request.postDataJSON();
    } catch {
      return request.postData() ?? null;
    }
  }

  async gotoPromotion() {
    await expect(this.page.getByText(await this.text('website_setting'), { exact: true }).first()).toBeVisible({
      timeout: 15000,
    });
    await this.sidebar.clickSubMenu('website_setting', 'promotion_activity');
  }

  async expectPromotionVisible() {
    await expect(this.page).toHaveURL(/\/setting\/promotion/);
    await expect(this.page.getByText(await this.text('promotion_activity'), { exact: true }).last()).toBeVisible();
    await expect(this.categoryTab()).toBeVisible();
    await expect(this.settingsTab()).toBeVisible();
  }

  async expectCategoryTabVisible() {
    await expect(this.categoryTab()).toHaveClass(/is-active/);
    await expect(this.paneSelect(0)).toBeVisible();
    await expect(this.activePane()).toContainText(await this.text('info_42'));
    await expect(this.activeTableHeader(await this.text('actions'))).toBeVisible();
  }

  async clickPromotionSettingsTab() {
    await this.settingsTab().click({ force: true });
    await waitForNetworkSettled(this.page, 800);
    await expect(this.settingsTab()).toHaveClass(/is-active/);
  }

  async clickCategoryTab() {
    await this.categoryTab().click({ force: true });
    await waitForNetworkSettled(this.page, 800);
    await expect(this.categoryTab()).toHaveClass(/is-active/);
  }

  async expectPromotionSettingsTabVisible() {
    await expect(this.paneSelect(0)).toBeVisible();
    await expect(this.paneSelect(1)).toBeVisible();
    await expect(this.paneSelect(1)).toContainText(await this.text('all_activity_type'));
    await expect(this.activePane().getByRole('button', { name: await this.text('promote_active') })).toBeVisible();
    await expect(this.activePane().getByRole('button', { name: await this.text('promote_schedule') })).toBeVisible();
    await expect(this.activePane().getByRole('button', { name: await this.text('promote_inactive') })).toBeVisible();
    await expect(this.activeTableHeader(await this.text('title'))).toBeVisible();
    await expect(this.activeTableHeader(await this.text('announcement_type'))).toBeVisible();
    await expect(this.activeTableHeader(await this.text('start_time'))).toBeVisible();
    await expect(this.activeTableHeader(await this.text('end_time'))).toBeVisible();
  }

  async expectSettingsCategoryOptionVisible(name: string) {
    const wrapper = this.paneSelect(1);
    await this.openSelectUntilOptionsVisible(wrapper);
    await expect(this.visibleOption(name)).toBeVisible();
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await waitForUiSettled(this.page, 300);
  }

  async openAddPromotionDialog() {
    const addButton = this.activePane()
      .locator('button')
      .filter({ has: this.page.locator('use[*|href="#icon-add"]') })
      .first();
    await expect(addButton).toBeEnabled();
    await addButton.click({ force: true });
    await this.expectAddPromotionDialogVisible();
  }

  async expectAddPromotionDialogVisible() {
    await expect(this.addPromotionDialog()).toBeVisible();
    await expect(this.addPromotionDialog().getByText('Add Promotion', { exact: true })).toBeVisible();
  }

  async cancelAddPromotionDialog() {
    await this.addPromotionDialogFooterButton(0).click({ force: true });
    await expect(this.addPromotionDialog()).toHaveCount(0);
    await waitForUiSettled(this.page, 300);
  }

  async submitAddPromotionDialog() {
    await this.addPromotionDialogFooterButton(1).click({ force: true });
    await waitForUiSettled(this.page, 300);
  }

  async expectAddPromotionAwaitingSiteSelection() {
    await expect(this.addPromotionDialog()).toContainText(await this.text('please_select_branch_first'));
    await expect(this.addPromotionDialog()).not.toContainText(await this.text('title'));
  }

  async selectAddPromotionSiteByName(name: string) {
    const wrapper = this.addPromotionDialogSiteSelect();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.openSelectUntilOptionsVisible(wrapper);
      await this.visibleOption(name).click({ force: true });
      await waitForNetworkSettled(this.page, 800);

      const selected = await wrapper.textContent();
      if (selected?.includes(name)) {
        return;
      }
    }

    await expect(wrapper).toContainText(name);
  }

  async currentAddPromotionDialogText(): Promise<string> {
    return ((await this.addPromotionDialog().textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  async expectAddPromotionTitleLanguages(expectedLabels: string[], requiredLabel: string) {
    const text = await this.currentAddPromotionDialogText();

    for (const label of expectedLabels) {
      expect(text).toContain(label);
    }

    await expect(this.addPromotionDialog()).toContainText(await this.text('title'));
    await expect(this.addPromotionDialog()).toContainText('Web');
    await expect(this.addPromotionDialog()).toContainText('H5');
    await expect(this.addPromotionDialog()).toContainText(await this.text('content'));
    await expect(
      this.addPromotionDialog().getByRole('tab', {
        name: new RegExp(`^${this.escapeRegex(requiredLabel)}\\s*\\*$`),
      })
    ).toBeVisible();
    await expect(this.addPromotionDialog().getByRole('textbox', { name: /^Title\*$/ })).toBeVisible();
  }

  async expectAddPromotionCategoryOptionVisible(name: string) {
    const wrapper = this.addPromotionDialogCategorySelect();
    await this.openSelectUntilOptionsVisible(wrapper);
    await expect(this.visibleOption(name)).toBeVisible();
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await waitForUiSettled(this.page, 300);
  }

  async selectAddPromotionCategoryByName(name: string) {
    const wrapper = this.addPromotionDialogCategorySelect();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.openSelectUntilOptionsVisible(wrapper);
      await this.visibleOption(name).click({ force: true });
      await waitForNetworkSettled(this.page, 500);

      const selected = await wrapper.textContent();
      if (selected?.includes(name)) {
        return;
      }
    }

    await expect(wrapper).toContainText(name);
  }

  async expectAddPromotionTimeAndPinOptionsVisible() {
    await expect(this.addPromotionDialog()).toContainText(await this.text('start_time'));
    await expect(this.addPromotionDialog()).toContainText(await this.text('end_time'));
    await expect(this.addPromotionDialog()).toContainText('Other');
    await expect(this.addPromotionDialog()).toContainText('Permanent');
    await expect(this.addPromotionDialog()).toContainText('Pin to top');
    await expect(this.addPromotionDialog()).toContainText('Yes');
    await expect(this.addPromotionDialog()).toContainText('No');
  }

  async fillAddPromotionStartTime(value: string) {
    const input = this.addPromotionDialog().locator('input[placeholder="YYYY-MM-DD hh:mm"]').nth(0);
    await input.click({ force: true });
    await input.evaluate(
      (element, nextValue) => {
        const htmlInput = element as HTMLInputElement;
        htmlInput.removeAttribute('readonly');
        htmlInput.value = nextValue;
        htmlInput.dispatchEvent(new Event('input', { bubbles: true }));
        htmlInput.dispatchEvent(new Event('change', { bubbles: true }));
        htmlInput.blur();
      },
      value
    );
    await waitForUiSettled(this.page, 300);
  }

  async chooseAddPromotionEndTimeMode(mode: 'Other' | 'Permanent') {
    await this.addPromotionDialog()
      .locator('.el-radio')
      .filter({ hasText: mode })
      .first()
      .locator('input[type="radio"]')
      .evaluate((element: HTMLInputElement) => element.click());
    await waitForUiSettled(this.page, 300);
  }

  async chooseAddPromotionPinTop(pin: boolean) {
    await this.addPromotionDialog()
      .locator('.el-radio')
      .filter({ hasText: pin ? 'Yes' : 'No' })
      .last()
      .locator('input[type="radio"]')
      .evaluate((element: HTMLInputElement) => element.click());
    await waitForUiSettled(this.page, 300);
  }

  async fillAddPromotionPrimaryTitle(value: string) {
    const input = this.addPromotionDialog().getByRole('textbox', { name: /^Title\*$/ }).first();
    await input.click({ force: true });
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }

  async fillAddPromotionPrimaryContent(value: string) {
    const editor = this.addPromotionDialog().locator('[role="textbox"]').last();
    await editor.click({ force: true });
    await this.page.keyboard.press('Control+A').catch(() => undefined);
    await this.page.keyboard.type(value);
    await waitForUiSettled(this.page, 300);
  }

  async expectAddPromotionRequiredErrorCount(count: number) {
    const requiredText = await this.text('required_field');
    await expect(this.addPromotionDialog().locator('.el-form-item__error').filter({ hasText: requiredText })).toHaveCount(count);
  }

  async expectAddPromotionImageRequiredErrors() {
    await expect(this.addPromotionDialog()).toContainText(/Web\s*\*Required/);
    await expect(this.addPromotionDialog()).toContainText(/H5\s*\*Required/);
  }

  async expectAddPromotionEndTimeInputDisabledUntilStartSelected() {
    await expect(this.addPromotionDialog().locator('input[placeholder="YYYY-MM-DD hh:mm"]').nth(1)).toBeDisabled();
  }

  async expectAddPromotionEndTimeInputEnabled() {
    await expect(this.addPromotionDialog().locator('input[placeholder="YYYY-MM-DD hh:mm"]').nth(1)).toBeEnabled();
  }

  async selectSiteByName(name: string) {
    const wrapper = this.paneSelect(0);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.openSelectUntilOptionsVisible(wrapper);
      await this.visibleOption(name).click({ force: true });
      await waitForNetworkSettled(this.page, 800);

      const selected = await wrapper.textContent();
      if (selected?.includes(name)) {
        return;
      }
    }

    await expect(wrapper).toContainText(name);
  }

  async openAddCategoryDialog() {
    const addButton = this.categoryAddButton();
    await expect(addButton).toBeEnabled();
    await addButton.click({ force: true });
    await this.expectAddCategoryDialogVisible();
  }

  async expectAddCategoryButtonDisabled() {
    await expect(this.categoryAddButton()).toBeDisabled();
  }

  async openCategorySortMode() {
    await expect(this.categorySortToggleButton()).toBeVisible();
    await this.categorySortToggleButton().click({ force: true });
    await this.expectCategorySortModeVisible();
  }

  async expectCategorySortModeVisible() {
    await expect(this.categorySortCancelButton()).toBeVisible();
    await expect(this.categorySortSaveButton()).toBeVisible();
    await expect
      .poll(async () => this.activePane().locator('.drag-handle').count(), { timeout: 5000 })
      .toBeGreaterThan(0);
  }

  async cancelCategorySortMode() {
    await this.categorySortCancelButton().click({ force: true });
    await expect(this.categorySortSaveButton()).toHaveCount(0);
    await expect(this.activePane().locator('.drag-handle')).toHaveCount(0);
    await waitForNetworkSettled(this.page, 800);
  }

  async submitCategorySortAndWaitForTransaction(): Promise<PromotionTypeSortTransaction> {
    const requestPromise = this.waitForPromotionTypeSortRequest().catch(() => null);
    const responsePromise = this.waitForPromotionTypeMutation('/api/v0/promotion-type/sort', 'PUT').catch(() => null);

    await this.categorySortSaveButton().click({ force: true });
    const [requestBody, responseBody] = await Promise.all([requestPromise, responsePromise]);

    if (responseBody?.success !== true) {
      throw new Error(`Sort promotion category failed: ${JSON.stringify(responseBody)}`);
    }

    await expect(this.categorySortSaveButton()).toHaveCount(0);
    await expect(this.activePane().locator('.drag-handle')).toHaveCount(0);
    await waitForNetworkSettled(this.page, 800);
    return { requestBody, responseBody };
  }

  async expectAddCategoryDialogVisible() {
    await expect(this.categoryDialog()).toBeVisible();
    await expect(this.categoryDialog().getByText('Add Category Name', { exact: true })).toBeVisible();
    await expect(this.categoryDialogFooterButton(0)).toBeVisible();
    await expect(this.categoryDialogFooterButton(1)).toBeDisabled();
  }

  async expectAddCategoryAwaitingSiteSelection() {
    await expect(this.categoryDialog()).toContainText(await this.text('please_select_branch_first'));
    await expect(this.categoryDialog().getByRole('textbox')).toHaveCount(0);
    await expect(this.categoryDialogFooterButton(1)).toBeDisabled();
  }

  async cancelAddCategoryDialog() {
    await this.categoryDialogFooterButton(0).click({ force: true });
    await expect(this.page.locator('.el-dialog:visible')).toHaveCount(0);
  }

  async selectAddCategorySiteByName(name: string) {
    const wrapper = this.categoryDialogSiteSelect();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.openSelectUntilOptionsVisible(wrapper);
      await this.visibleOption(name).click({ force: true });
      await waitForNetworkSettled(this.page, 800);

      const selected = await wrapper.textContent();
      if (selected?.includes(name)) {
        return;
      }
    }

    await expect(wrapper).toContainText(name);
  }

  async expectAddCategorySubmitEnabled() {
    await expect(this.categoryDialogFooterButton(1)).toBeEnabled();
  }

  async submitAddCategoryDialog() {
    await this.categoryDialogFooterButton(1).click({ force: true });
    await waitForUiSettled(this.page, 300);
  }

  async fillAddCategoryPrimaryName(value: string) {
    const input = this.categoryDialog().getByRole('textbox').first();
    await input.click({ force: true });
    await input.press('Control+A');
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }

  async openColorSettingDialog() {
    await this.categoryDialog().locator('.svg-icon.cursor-pointer').first().click({ force: true });
    await expect(this.colorSettingDialog()).toBeVisible();
  }

  async selectCategoryColorByIndex(index = 0) {
    await this.openColorSettingDialog();
    const dialog = this.colorSettingDialog();
    await dialog.locator('.rounded-full.hover\\:cursor-pointer').nth(index).click({ force: true });
    await dialog.locator('.el-dialog__footer button').nth(1).click({ force: true });
    await expect(dialog).toHaveCount(0);
    await waitForUiSettled(this.page, 300);
  }

  async openEditCategoryDialogByText(text: string) {
    await this.expectCategoryRowVisibleByText(text);
    await this.categoryRowByText(text).locator('.bg-mainBlue').first().click({ force: true });
    await expect(this.editCategoryDialog()).toBeVisible();
    await expect(this.editCategoryDialog().getByText('Edit Category Name', { exact: true })).toBeVisible();
    await waitForNetworkSettled(this.page, 800);
    await expect(this.editCategoryDialog().getByRole('textbox').first()).toBeVisible();
  }

  async dragCategoryRowByTextToCategoryRow(sourceText: string, targetText: string) {
    const sourceHandle = this.categoryRowByText(sourceText).locator('.drag-handle').first();
    const targetHandle = this.categoryRowByText(targetText).locator('.drag-handle').first();

    await expect(sourceHandle).toBeVisible();
    await expect(targetHandle).toBeVisible();

    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error(`Unable to drag category row from "${sourceText}" to "${targetText}"`);
    }

    await this.page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 12 });
    await this.page.mouse.up();
    await waitForUiSettled(this.page, 500);
  }

  async expectEditCategorySiteDisabled() {
    await expect(this.editCategoryDialog().locator('.el-select__wrapper').first()).toHaveClass(/is-disabled/);
  }

  async fillEditCategoryPrimaryName(value: string) {
    const input = this.editCategoryDialog().getByRole('textbox').first();
    await input.click({ force: true });
    await input.press('Control+A');
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }

  async clearEditCategoryPrimaryName() {
    const input = this.editCategoryDialog().getByRole('textbox').first();
    await input.click({ force: true });
    await input.press('Control+A');
    await input.fill('');
    await expect(input).toHaveValue('');
  }

  async cancelEditCategoryDialog() {
    await this.editCategoryDialogFooterButton(0).click({ force: true });
    await expect(this.editCategoryDialog()).toHaveCount(0);
    await waitForUiSettled(this.page, 300);
  }

  async submitEditCategoryDialogAndWaitForUpdateTransaction(): Promise<PromotionTypeUpdateTransaction> {
    const requestPromise = this.waitForPromotionTypeUpdateRequest().catch(() => null);
    const responsePromise = this.waitForPromotionTypeMutation('/api/v0/promotion-type/update/', 'PUT').catch(() => null);

    await this.editCategoryDialogFooterButton(1).click({ force: true });
    const [requestBody, responseBody] = await Promise.all([requestPromise, responsePromise]);

    if (responseBody?.success !== true) {
      throw new Error(`Update promotion category failed: ${JSON.stringify(responseBody)}`);
    }

    await expect(this.editCategoryDialog()).toHaveCount(0);
    await waitForNetworkSettled(this.page, 800);
    return { requestBody, responseBody };
  }

  async submitEditCategoryDialog() {
    await this.editCategoryDialogFooterButton(1).click({ force: true });
    await waitForUiSettled(this.page, 300);
  }

  async submitAddCategoryDialogAndWaitForCreateTransaction(): Promise<PromotionTypeCreateTransaction> {
    const requestPromise = this.waitForPromotionTypeCreateRequest().catch(() => null);
    const responsePromise = this.waitForPromotionTypeMutation('/api/v0/promotion-type/create', 'POST').catch(() => null);

    await this.categoryDialogFooterButton(1).click({ force: true });
    const [requestBody, responseBody] = await Promise.all([requestPromise, responsePromise]);

    if (responseBody?.success !== true) {
      throw new Error(`Create promotion category failed: ${JSON.stringify(responseBody)}`);
    }

    await expect(this.categoryDialog()).toHaveCount(0);
    await waitForNetworkSettled(this.page, 800);
    return { requestBody, responseBody };
  }

  async categoryTableHeaderTexts(): Promise<string[]> {
    return (await this.activeTableHeaders().allTextContents())
      .map((text) => text.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  async expectCategoryTableHeaders(expectedLabels: string[]) {
    const headers = await this.categoryTableHeaderTexts();
    expect(headers.slice(0, expectedLabels.length)).toEqual(expectedLabels);
  }

  async currentAddCategoryDialogText(): Promise<string> {
    return ((await this.categoryDialog().textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  async categoryRowTexts(): Promise<string[]> {
    return this.categoryRows().evaluateAll((rows) =>
      rows
        .map((row) => {
          const cellTexts = Array.from(row.querySelectorAll('td'))
            .map((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim())
            .filter(Boolean);

          return cellTexts.find((text) => text !== '-') ?? '';
        })
        .filter(Boolean)
    );
  }

  async expectAddCategoryNameLanguages(expectedLabels: string[], requiredLabel: string) {
    const text = await this.currentAddCategoryDialogText();

    for (const label of expectedLabels) {
      expect(text).toContain(label);
    }

    await expect(
      this.categoryDialog().getByRole('textbox', {
        name: new RegExp(`^${this.escapeRegex(requiredLabel)}\\*$`),
      })
    ).toBeVisible();
  }

  async expectAddCategoryPrimaryNameRequired(requiredLabel: string) {
    await expect(this.categoryDialog()).toContainText(await this.text('required_field'));
    await expect(
      this.categoryDialog().getByRole('textbox', {
        name: new RegExp(`^${this.escapeRegex(requiredLabel)}\\*$`),
      })
    ).toBeVisible();
  }

  async expectAddCategoryRequiredErrorCount(count: number) {
    const requiredText = await this.text('required_field');
    await expect(this.categoryDialog().locator('.el-form-item__error').filter({ hasText: requiredText })).toHaveCount(count);
  }

  async expectEditCategoryPrimaryNameRequired(requiredLabel: string) {
    await expect(this.editCategoryDialog()).toContainText(await this.text('required_field'));
    await expect(
      this.editCategoryDialog().getByRole('textbox', {
        name: new RegExp(`^${this.escapeRegex(requiredLabel)}\\*$`),
      })
    ).toBeVisible();
  }

  async expectEditCategoryRequiredErrorCount(count: number) {
    const requiredText = await this.text('required_field');
    await expect(this.editCategoryDialog().locator('.el-form-item__error').filter({ hasText: requiredText })).toHaveCount(count);
  }

  async expectCategoryRowVisibleByText(text: string) {
    await expect.poll(async () => this.hasCategoryRow(text), { timeout: 15000 }).toBe(true);
  }

  async expectCategoryRowNotVisibleByText(text: string) {
    await expect.poll(async () => this.hasCategoryRow(text), { timeout: 15000 }).toBe(false);
  }

  async hasCategoryRow(text: string): Promise<boolean> {
    const row = this.categoryRowByText(text);
    return row.isVisible().catch(() => false);
  }

  async clickDeleteCategoryByText(text: string) {
    await this.expectCategoryRowVisibleByText(text);
    await this.categoryRowByText(text).locator('.bg-notice').first().click({ force: true });
  }

  async expectConfirmDeleteCategoryDialog() {
    await expect(this.page.locator('.el-dialog:visible').last()).toContainText(await this.text('confirm_deletion_again'));
  }

  async cancelConfirmDialog() {
    const dialog = this.page.locator('.el-dialog:visible').last();
    await dialog.locator('.el-dialog__footer button').nth(0).click({ force: true });
    await expect(dialog).toHaveCount(0);
    await waitForUiSettled(this.page, 300);
  }

  async confirmDeleteCategoryAndWaitForDelete() {
    const dialog = this.page.locator('.el-dialog:visible').last();
    const responsePromise = this.waitForPromotionTypeMutation('/api/v0/promotion-type/delete', 'DELETE');

    await dialog.locator('.el-dialog__footer button').nth(1).click({ force: true });
    const body = await responsePromise;

    if (body?.success !== true) {
      throw new Error(`Delete promotion category failed: ${JSON.stringify(body)}`);
    }

    await expect(dialog).toHaveCount(0);
    await waitForNetworkSettled(this.page, 800);
  }

  async expectLatestAlertContains(message: string | RegExp) {
    const deadline = Date.now() + 5000;

    while (Date.now() < deadline) {
      const texts = ((await this.page.locator('.el-message, [role="alert"]').allTextContents()) ?? []).map((text) =>
        text.trim()
      );

      const matched = texts.some((text) =>
        typeof message === 'string' ? text.includes(message) : message.test(text)
      );

      if (matched) {
        return;
      }

      await this.page.waitForTimeout(200);
    }

    const actualTexts = ((await this.page.locator('.el-message, [role="alert"]').allTextContents()) ?? []).map((text) =>
      text.trim()
    );

    expect(actualTexts).toEqual(
      expect.arrayContaining([typeof message === 'string' ? expect.stringContaining(message) : expect.stringMatching(message)])
    );
  }
}
