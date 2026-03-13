import { Locator, Page, expect } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';
import { waitForNetworkSettled, waitForUiSettled, waitForVisibleSelectOptions } from './CommonPage';

type RoleStatus = 'Enable' | 'Disable';

export class BOOperatorRolePage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  readonly listBox: Locator;
  readonly pager: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.listBox = page.locator('.page-box').nth(1);
    this.pager = this.listBox.locator('.el-pagination').last();
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

  private dialog(): Locator {
    return this.page.locator('.el-dialog').last();
  }

  private statusSelect(): Locator {
    return this.dialog().locator('.el-select__wrapper').first();
  }

  private siteSelect(): Locator {
    return this.dialog().locator('.el-select__wrapper').nth(1);
  }

  private async statusText(status: RoleStatus): Promise<string> {
    const [primaryText] = await this.statusTexts(status);
    return primaryText;
  }

  private async statusTexts(status: RoleStatus): Promise<string[]> {
    const keys = status === 'Enable'
      ? ['simple_status_1', 'basic_status_1', 'status_1', 'enable']
      : ['simple_status_0', 'basic_status_0', 'status_0'];

    const values = await Promise.all(keys.map((key) => this.text(key)));
    return [...new Set(values.filter(Boolean))];
  }

  private async waitForOverlayToSettle() {
    await waitForUiSettled(this.page, 500);
  }

  private async goToListPage(pageNumber: number) {
    const pageButton = this.pager.locator('.el-pager li.number', { hasText: String(pageNumber) }).first();
    await pageButton.click({ force: true });
    await waitForNetworkSettled(this.page, 800);
  }

  private async lastPageNumber(): Promise<number> {
    const labels = await this.pager
      .locator('.el-pager li.number')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => Number.parseInt(node.textContent?.trim() ?? '', 10))
          .filter((value) => Number.isFinite(value))
      );

    return labels[labels.length - 1] ?? 1;
  }

  private async openPageContainingRole(name: string): Promise<boolean> {
    const lastPage = await this.lastPageNumber();

    for (let pageNumber = 1; pageNumber <= lastPage; pageNumber += 1) {
      if (pageNumber > 1) {
        await this.goToListPage(pageNumber);
      }

      if (await this.rowByRoleName(name).count()) {
        return true;
      }
    }

    return false;
  }

  private async waitForRoleInList(name: string) {
    const deadline = Date.now() + 15000;

    while (Date.now() < deadline) {
      await this.gotoRolePermissionList();
      await waitForNetworkSettled(this.page, 800);

      if (await this.openPageContainingRole(name)) {
        return;
      }

      await waitForUiSettled(this.page, 1000);
    }

    throw new Error(`Role ${name} was not visible in list before timeout`);
  }

  rowByRoleName(name: string): Locator {
    return this.page.locator('tr.el-table__row').filter({
      has: this.page.getByText(name, { exact: true }),
    }).first();
  }

  async gotoRolePermissionList() {
    await this.sidebar.clickSubMenu('operator', 'role_permission');
  }

  async expectRolePermissionListVisible() {
    await expect(this.page).toHaveURL(/\/operator\/role$/);
    await expect(this.page.getByText(await this.i18n.t('role_permission'), { exact: true }).last()).toBeVisible();
  }

  async openAddRoleDialog() {
    await this.listBox.locator('button').first().click({ force: true });
    await waitForUiSettled(this.page, 300);
  }

  async expectAddRoleDialogVisible() {
    await expect(this.dialog()).toBeVisible();
    await expect(this.dialog()).toContainText(await this.text('add_role'));
  }

  async fillRoleName(name: string) {
    await this.dialog().getByLabel(await this.text('role')).fill(name);
  }

  async selectStatus(status: RoleStatus) {
    const optionTexts = await this.statusTexts(status);

    await this.statusSelect().click({ force: true });
    await waitForVisibleSelectOptions(this.page);
    for (const optionText of optionTexts) {
      const option = this.visibleOption(optionText);
      if (await option.count()) {
        await option.click({ force: true });
        await this.waitForOverlayToSettle();
        return;
      }
    }

    const fallbackIndex = status === 'Enable' ? 1 : 0;
    await this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item').nth(fallbackIndex).click({ force: true });
    await this.waitForOverlayToSettle();
  }

  async selectSiteByIndex(index = 0) {
    await this.siteSelect().click({ force: true });
    await waitForVisibleSelectOptions(this.page);
    await this.page.locator('.el-select-dropdown:visible .el-select-dropdown__item').nth(index).click({ force: true });
    await this.waitForOverlayToSettle();
  }

  async enableFirstModuleViewPermission() {
    await this.dialog()
      .locator('.permissions > .el-form-item__content > div > div')
      .first()
      .locator('div.cursor-pointer')
      .nth(1)
      .click({ force: true });
  }

  async saveRoleDialog() {
    await this.dialog().locator('button.btn-primary').click({ force: true });
    await waitForNetworkSettled(this.page, 500);
  }

  async cancelRoleDialog() {
    await this.dialog().locator('button.btn-blue').click({ force: true });
    await waitForUiSettled(this.page, 300);
  }

  async expectRoleDialogHidden() {
    await expect(this.dialog()).toBeHidden();
  }

  async expectRequiredValidationErrors(count: number) {
    const errors = this.dialog().locator('.el-form-item__error');
    await expect(errors).toHaveCount(count);
    await expect(errors).toHaveText(Array(count).fill(await this.text('required_field')));
  }

  async expectRoleNameErrorContains(messages: Array<string | RegExp>) {
    const error = this.dialog().locator('.el-form-item').filter({
      has: this.page.getByText(await this.text('role'), { exact: true }),
    }).locator('.el-form-item__error').first();

    await expect(error).toBeVisible();

    const actualText = (await error.textContent())?.trim() ?? '';
    expect(
      messages.some((message) =>
        typeof message === 'string' ? actualText.includes(message) : message.test(actualText)
      )
    ).toBeTruthy();
  }

  async createRole(data: {
    name: string;
    status?: RoleStatus;
    siteIndex?: number;
  }) {
    await this.openAddRoleDialog();
    await this.expectAddRoleDialogVisible();
    await this.fillRoleName(data.name);
    await this.selectSiteByIndex(data.siteIndex ?? 0);
    await this.selectStatus(data.status ?? 'Enable');
    await this.enableFirstModuleViewPermission();
    await this.saveRoleDialog();
  }

  async expectRoleInList(name: string) {
    await this.waitForRoleInList(name);
    await expect(this.rowByRoleName(name)).toBeVisible();
  }

  async clickEditByRoleName(name: string) {
    await this.expectRoleInList(name);
    const row = this.rowByRoleName(name);
    await expect(row).toBeVisible();
    await row.locator('div.bg-mainBlue').first().click({ force: true });
  }

  async expectEditRoleDialogVisible() {
    await expect(this.dialog()).toBeVisible();
    await expect(this.dialog()).toContainText(await this.text('edit_role'));
  }

  async updateRole(data: {
    name?: string;
    status?: RoleStatus;
    siteIndex?: number;
  }) {
    if (data.name !== undefined) {
      await this.fillRoleName(data.name);
    }

    if (data.status !== undefined) {
      await this.selectStatus(data.status);
    }

    if (data.siteIndex !== undefined) {
      await this.selectSiteByIndex(data.siteIndex);
    }

    await this.saveRoleDialog();
  }

  async toggleStatusByRoleName(name: string) {
    await this.expectRoleInList(name);
    const row = this.rowByRoleName(name);
    await expect(row).toBeVisible();
    await row.locator('.el-switch').click({ force: true });
    await waitForNetworkSettled(this.page, 500);
  }

  async expectRoleRowContains(name: string, text: string) {
    await this.expectRoleInList(name);
    await expect(this.rowByRoleName(name)).toContainText(text);
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

  async expectSuccessAlert() {
    await this.expectAlertContainsAny([
      await this.text('success'),
      await this.text('added_successfully'),
      await this.text('update_success'),
      await this.text('edit_success'),
      /success|added|updated|edited/i,
    ]);
  }
}
