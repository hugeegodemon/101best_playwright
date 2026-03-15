import { expect, Locator, Page } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';
import { waitForNetworkSettled, waitForUiSettled, waitForVisibleSelectOptions } from './CommonPage';

export class BOCustomerServicePage {
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

  async copy(key: string, namespace: 'backend' | 'frontend' | 'error_code' = 'backend'): Promise<string> {
    return this.i18n.t(key, namespace);
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async gotoCustomerService() {
    await expect(this.page.getByText(await this.text('website_setting'), { exact: true }).first()).toBeVisible({
      timeout: 15000,
    });
    await this.sidebar.clickSubMenu('website_setting', 'service_management');
    await waitForNetworkSettled(this.page);
  }

  // ── Page structure locators ──────────────────────────────────────────────────

  // The content area is the parent of the .el-table — contains title, action buttons, and table.
  private contentArea(): Locator {
    return this.page.locator('.el-table').first().locator('..');
  }

  private siteSelectWrapper(): Locator {
    // nth(0) = language selector in the header; nth(1) = page-level site selector in content area.
    return this.page.locator('.el-select__wrapper').nth(1);
  }

  // The add button is the first button in the content area
  private addButton(): Locator {
    return this.contentArea().locator('button').first();
  }

  // The sort/reorder button is the last button in the content area (when not in sort mode)
  private sortButton(): Locator {
    return this.contentArea().locator('button').last();
  }

  listRows(): Locator {
    return this.page.locator('tr.el-table__row');
  }

  rowByName(name: string): Locator {
    // Use anchored regex to avoid substring matches (e.g. "AutoCS" matching "AutoCSE")
    return this.listRows().filter({
      has: this.page.locator('td .cell').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }),
    }).first();
  }

  // ── Dialog locators ─────────────────────────────────────────────────────────

  private dialog(): Locator {
    // The add/edit dialog is the first .el-dialog in DOM; the confirm delete dialog is appended later.
    return this.page.locator('.el-dialog').first();
  }

  private dialogFooterButton(index: number): Locator {
    return this.dialog().locator('.el-dialog__footer button').nth(index);
  }

  private dialogFileInput(index: number): Locator {
    return this.dialog().locator('input[type=file]').nth(index);
  }

  private dialogSiteSelect(): Locator {
    return this.dialog().locator('.el-select__wrapper').first();
  }

  private dialogNameInput(): Locator {
    return this.dialog().locator('input.el-input__inner').first();
  }

  private dialogHyperlinkInput(): Locator {
    return this.dialog().locator('input.el-input__inner').nth(1);
  }

  private dialogIdInput(): Locator {
    return this.dialog().locator('input.el-input__inner').nth(2);
  }

  // ── Page assertions ──────────────────────────────────────────────────────────

  async expectCustomerServiceVisible() {
    await expect(this.page.getByText(await this.text('service_management'), { exact: true }).last()).toBeVisible({
      timeout: 10000,
    });
    // Wait for the table to render before checking the site selector (table is always shown, even when empty)
    await expect(this.page.locator('.el-table').first()).toBeVisible({ timeout: 10000 });
    await expect(this.siteSelectWrapper()).toBeVisible();
  }

  async expectAddButtonVisible() {
    await expect(this.addButton()).toBeVisible({ timeout: 8000 });
  }

  async expectAddButtonDisabled() {
    await expect(this.addButton()).toBeDisabled({ timeout: 8000 });
  }

  // ── Site selection ───────────────────────────────────────────────────────────

  private async selectOptionByText(siteName: string) {
    await this.page
      .locator('.el-select-dropdown:visible .el-select-dropdown__item')
      .filter({ hasText: siteName })
      .first()
      .click({ force: true });
  }

  async selectSiteByName(siteName: string) {
    await this.openSelectUntilOptionsVisible(this.siteSelectWrapper());
    await this.selectOptionByText(siteName);
    await waitForNetworkSettled(this.page, 600);
  }

  // ── Add dialog ───────────────────────────────────────────────────────────────

  async openAddDialog() {
    await expect(this.addButton()).toBeEnabled({ timeout: 8000 });
    await this.addButton().click({ force: true });
    await expect(this.dialog()).toBeVisible({ timeout: 8000 });
    await waitForUiSettled(this.page);
  }

  async expectAddDialogVisible() {
    await expect(this.dialog()).toBeVisible();
    await expect(this.dialog().getByText(await this.text('add_service'), { exact: true })).toBeVisible();
  }

  async cancelDialog() {
    await this.dialogFooterButton(0).click({ force: true });
    await expect(this.dialog()).not.toBeVisible({ timeout: 8000 });
    await waitForUiSettled(this.page);
  }

  private async openSelectUntilOptionsVisible(wrapper: Locator, maxAttempts = 3): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await wrapper.click({ force: true });
      const hasOptions = await expect
        .poll(async () => this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item').count(), {
          timeout: 2000,
        })
        .toBeGreaterThan(0)
        .then(() => true)
        .catch(() => false);
      if (hasOptions) return;
    }
  }

  async selectDialogSiteByName(siteName: string) {
    await waitForUiSettled(this.page);
    await this.openSelectUntilOptionsVisible(this.dialogSiteSelect());
    await this.selectOptionByText(siteName);
    await waitForUiSettled(this.page);
  }

  async fillName(name: string) {
    const input = this.dialogNameInput();
    await input.click();
    await input.press('ControlOrMeta+A');
    await input.fill(name);
  }

  async fillServiceId(id: string) {
    const input = this.dialogIdInput();
    await input.click();
    await input.press('ControlOrMeta+A');
    await input.fill(id);
  }

  async fillHyperlink(url: string) {
    const input = this.dialogHyperlinkInput();
    await input.click();
    await input.press('ControlOrMeta+A');
    await input.fill(url);
  }

  // Uploads the Image field (required — main logo icon shown in the list).
  // Waits for the upload AJAX call to complete (the image is uploaded to the server first).
  async uploadImage(filePath: string) {
    await this.dialogFileInput(0).setInputFiles(filePath);
    await waitForNetworkSettled(this.page, 1000);
  }

  // Uploads the QRcode field (optional)
  async uploadQrCode(filePath: string) {
    await this.dialogFileInput(1).setInputFiles(filePath);
    await waitForUiSettled(this.page);
  }

  async submitDialog() {
    await this.dialogFooterButton(1).click({ force: true });
    await waitForNetworkSettled(this.page);
  }

  async submitDialogAndWaitForCreate() {
    await this.submitDialog();
    await expect(this.dialog()).not.toBeVisible({ timeout: 15000 });
    await waitForNetworkSettled(this.page, 800);
  }

  // Action buttons in each row use SVG icon divs with specific background classes:
  // Edit = .bg-mainBlue, Delete = .bg-notice
  private rowEditButton(name: string): Locator {
    return this.rowByName(name).locator('.bg-mainBlue.el-tooltip__trigger').first();
  }

  private rowDeleteButton(name: string): Locator {
    return this.rowByName(name).locator('.bg-notice.el-tooltip__trigger').first();
  }

  // ── Edit dialog ───────────────────────────────────────────────────────────────

  async openEditByName(name: string) {
    const row = this.rowByName(name);
    await expect(row).toBeVisible();
    await this.rowEditButton(name).click({ force: true });
    await expect(this.dialog()).toBeVisible({ timeout: 8000 });
    await waitForUiSettled(this.page);
  }

  async expectEditDialogVisible() {
    await expect(this.dialog()).toBeVisible();
    await expect(this.dialog().getByText(await this.text('edit_service'), { exact: true })).toBeVisible();
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  async clickDeleteByName(name: string) {
    const row = this.rowByName(name);
    await expect(row).toBeVisible();
    await this.rowDeleteButton(name).click({ force: true });
    await waitForUiSettled(this.page);
  }

  async confirmDeleteDialog() {
    const confirmDialog = this.page.locator('.el-dialog').last();
    await expect(confirmDialog).toBeVisible({ timeout: 8000 });
    await confirmDialog.locator('.el-dialog__footer button').nth(1).click({ force: true });
    await waitForNetworkSettled(this.page, 800);
    await expect(confirmDialog).not.toBeVisible({ timeout: 8000 });
  }

  async cancelDeleteDialog() {
    const confirmDialog = this.page.locator('.el-dialog').last();
    await expect(confirmDialog).toBeVisible({ timeout: 8000 });
    await confirmDialog.locator('.el-dialog__footer button').nth(0).click({ force: true });
    await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });
    await waitForUiSettled(this.page);
  }

  // ── Sort / Reorder ────────────────────────────────────────────────────────────

  async openSortMode() {
    await expect(this.sortButton()).toBeEnabled({ timeout: 8000 });
    await this.sortButton().click({ force: true });
    await expect.poll(async () => this.page.locator('.drag-handle').count(), { timeout: 5000 }).toBeGreaterThan(0);
  }

  async cancelSortMode() {
    // Sort mode buttons are icon-only (no text). Cancel = btn-blue, Save = btn-primary.
    await this.page.locator('button.btn-blue:visible').last().click({ force: true });
    await expect(this.page.locator('.drag-handle')).toHaveCount(0, { timeout: 5000 });
    await waitForUiSettled(this.page);
  }

  async saveSortMode() {
    await this.page.locator('button.btn-primary:visible').last().click({ force: true });
    await expect(this.page.locator('.drag-handle')).toHaveCount(0, { timeout: 8000 });
    await waitForNetworkSettled(this.page, 800);
  }

  async dragRowToRow(sourceText: string, targetText: string) {
    const sourceHandle = this.rowByName(sourceText).locator('.drag-handle').first();
    const targetHandle = this.rowByName(targetText).locator('.drag-handle').first();

    const sourceBbox = await sourceHandle.boundingBox();
    const targetBbox = await targetHandle.boundingBox();

    if (!sourceBbox || !targetBbox) {
      throw new Error(`Unable to get bounding box for drag from "${sourceText}" to "${targetText}"`);
    }

    await this.page.mouse.move(sourceBbox.x + sourceBbox.width / 2, sourceBbox.y + sourceBbox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(targetBbox.x + targetBbox.width / 2, targetBbox.y + targetBbox.height / 2, { steps: 10 });
    await this.page.mouse.up();
    await waitForUiSettled(this.page);
  }

  // ── List assertions ───────────────────────────────────────────────────────────

  async expectServiceInList(name: string) {
    await expect(this.rowByName(name)).toBeVisible({ timeout: 10000 });
  }

  async expectServiceNotInList(name: string) {
    await expect(this.rowByName(name)).toHaveCount(0, { timeout: 10000 });
  }

  async listRowTexts(): Promise<string[]> {
    const rows = this.listRows();
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td .cell');
      const cellTexts = await cells.allInnerTexts();
      // Pick the Name column (second visible text cell, skipping image and empty cells)
      const name = cellTexts.find((t) => t.trim() && t.trim() !== '-') ?? '';
      texts.push(name.trim());
    }
    return texts;
  }

  async rowCount(): Promise<number> {
    return this.listRows().count();
  }

  // ── Alert ─────────────────────────────────────────────────────────────────────

  async expectLatestAlertContainsAny(keys: string[]) {
    const texts = await Promise.all(keys.map((k) => this.copy(k).catch(() => k)));
    const alert = this.page.locator('.el-message, [role="alert"]').last();
    await expect(alert).toBeVisible({ timeout: 8000 });
    await expect
      .poll(async () => {
        const t = await alert.innerText().catch(() => '');
        return texts.some((msg) => t.includes(msg));
      }, { timeout: 8000 })
      .toBe(true);
  }

  async expectFormValidationVisible(key: string) {
    const msg = await this.text(key);
    await expect(this.page.locator('.el-form-item__error').filter({ hasText: msg }).first()).toBeVisible({
      timeout: 5000,
    });
  }
}
