import { Locator, Page, expect } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';
import { BOI18n } from '../../utils/i18n';

type RoleStatus = 'Enable' | 'Disable';

export class BOOperatorRolePage {
  readonly page: Page;
  readonly sidebar: BOSidebarPage;
  readonly listBox: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);
    this.listBox = page.locator('.page-box').nth(1);
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

  private async statusText(status: RoleStatus): Promise<string> {
    return this.text(status === 'Enable' ? 'basic_status_1' : 'basic_status_0');
  }

  private async waitForOverlayToSettle() {
    await this.page.waitForTimeout(500);
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
  }

  async expectAddRoleDialogVisible() {
    await expect(this.dialog()).toBeVisible();
    await expect(this.dialog()).toContainText(await this.text('add_role'));
  }

  async fillRoleName(name: string) {
    await this.dialog().getByLabel(await this.text('role')).fill(name);
  }

  async selectStatus(status: RoleStatus) {
    const wrapper = this.dialog().locator('.el-form-item').filter({
      has: this.page.getByText(await this.text('state'), { exact: true }),
    }).locator('.el-select__wrapper').first();

    await wrapper.click({ force: true });
    await this.visibleOption(await this.statusText(status)).click({ force: true });
    await this.waitForOverlayToSettle();
  }

  async selectSiteByIndex(index = 0) {
    const wrapper = this.dialog().locator('.el-form-item').filter({
      has: this.page.getByText(await this.text('site'), { exact: true }),
    }).locator('.el-select__wrapper').first();

    await wrapper.click({ force: true });
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
  }

  async cancelRoleDialog() {
    await this.dialog().locator('button.btn-blue').click({ force: true });
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
    await this.selectStatus(data.status ?? 'Enable');
    await this.selectSiteByIndex(data.siteIndex ?? 0);
    await this.enableFirstModuleViewPermission();
    await this.saveRoleDialog();
  }

  async expectRoleInList(name: string) {
    await expect(this.rowByRoleName(name)).toBeVisible();
  }

  async clickEditByRoleName(name: string) {
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
    const row = this.rowByRoleName(name);
    await expect(row).toBeVisible();
    await row.locator('.el-switch').click({ force: true });
  }

  async expectRoleRowContains(name: string, text: string) {
    await expect(this.rowByRoleName(name)).toContainText(text);
  }

  async expectAlertContainsAny(messages: Array<string | RegExp>) {
    const alert = this.page.locator('.el-message, [role="alert"]').last();
    await expect(alert).toBeVisible();

    const actualText = (await alert.textContent())?.trim() ?? '';
    expect(
      messages.some((message) =>
        typeof message === 'string' ? actualText.includes(message) : message.test(actualText)
      )
    ).toBeTruthy();
  }
}
