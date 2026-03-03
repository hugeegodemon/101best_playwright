import { Page, Locator, expect } from '@playwright/test';
import { BOSidebarPage } from './SidebarPage';

export class BOAdminPage {
    readonly page: Page;
    readonly sidebar: BOSidebarPage;

    // list page
    readonly addButton: Locator;
    readonly table: Locator;

    // search area
    readonly searchTypeSelect: Locator;
    readonly keywordInput: Locator;
    readonly statusFilterSelect: Locator;
    readonly resetButton: Locator;
    readonly searchButton: Locator;

    // create / edit form
    readonly accountInput: Locator;
    readonly nameInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly emailInput: Locator;
    readonly statusSelect: Locator;
    readonly saveButton: Locator;

    constructor(page: Page) {
    this.page = page;
    this.sidebar = new BOSidebarPage(page);

    const filterBox = page.locator('.page-box').nth(0);
    const listBox = page.locator('.page-box').nth(1);
    const filterForm = filterBox.locator('form.page-filter-form');
    const formActionArea = filterForm.locator('.el-form-item').last();
    const formActionBox = page.locator('.center-btn').first();

    // list page
    this.addButton = listBox.locator('button.btn-blue').first();
    this.table = listBox.locator('table.el-table__body').first();

    // search area
    this.searchTypeSelect = filterForm
        .locator('.el-form-item')
        .filter({ has: page.getByText('Account', { exact: true }) })
        .locator('.el-select__wrapper')
        .first();

    this.keywordInput = filterForm.locator('input.el-input__inner').first();

    this.statusFilterSelect = filterForm
        .locator('.el-form-item')
        .filter({ has: page.getByText('All Statuses', { exact: true }) })
        .locator('.el-select__wrapper')
        .first();
    this.resetButton = formActionArea.locator('button.btn-default').first();
    this.searchButton = formActionArea.locator('button.btn-primary').first();

    // create / edit form
    this.accountInput = page.getByLabel('Account');
    this.nameInput = page.getByLabel('Name');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password');
    this.emailInput = page.getByLabel('E-mail');

    this.statusSelect = page
        .locator('.el-form-item')
        .filter({ has: page.getByText('Status', { exact: true }) })
        .locator('.el-select__wrapper')
        .first();

    this.saveButton = formActionBox.locator('button.btn-primary').first();
    }

    async gotoAdminList() {
        await this.sidebar.clickSubMenu('Admin', 'Admin List');
    }

    async clickAddAdmin() {
        await this.addButton.click();
    }

    async selectCreateStatus(status: 'Enable' | 'Disable') {
        await this.statusSelect.click();
        await this.page.getByRole('option', { name: status }).click();
    }

    async fillCreateAdminForm(data: {
        account: string;
        name: string;
        password: string;
        email: string;
        status: 'Enable' | 'Disable';
    }) {
        await this.accountInput.fill(data.account);
        await this.nameInput.fill(data.name);
        await this.passwordInput.fill(data.password);
        await this.confirmPasswordInput.fill(data.password);
        await this.emailInput.fill(data.email);
        await this.selectCreateStatus(data.status);
    }

    async save() {
        await this.saveButton.click();
    }

    async createAdmin(data: {
        account: string;
        name: string;
        password: string;
        email: string;
        status: 'Enable' | 'Disable';
    }) {
        await this.fillCreateAdminForm(data);
        await this.save();
    }

    async selectSearchType(type: 'Account' | 'Name') {
        await this.searchTypeSelect.click();
        await this.page.getByRole('option', { name: type }).click();
    }

    async fillKeyword(keyword: string) {
        await this.keywordInput.fill(keyword);
    }

    async selectStatusFilter(status: 'All Statuses' | 'Enable' | 'Disable') {
        await this.statusFilterSelect.click();
        await this.page.getByRole('option', { name: status }).click();
    }

    async clickSearch() {
        await this.searchButton.click();
    }

    async searchAdmin(account: string) {
        await this.selectSearchType('Account');
        await this.fillKeyword(account);
        await this.clickSearch();
    }

    async searchAdminByName(name: string) {
        await this.selectSearchType('Name');
        await this.fillKeyword(name);
        await this.clickSearch();
    }

    async searchAdminWithStatus(
        account: string,
        status: 'All Statuses' | 'Enable' | 'Disable'
    ) {
        await this.selectSearchType('Account');
        await this.fillKeyword(account);
        await this.selectStatusFilter(status);
        await this.clickSearch();
    }

    async expectAdminInList(account: string) {
        await expect(this.table).toContainText(account);
    }

    rowByAccount(account: string): Locator {
        return this.page.locator('tr.el-table__row').filter({
        has: this.page.locator('td .cell', { hasText: account }),
        }).first();
    }

    async clickEditByAccount(account: string) {
        const row = this.rowByAccount(account);

        await row.locator('div.bg-mainBlue').first().click();
    }

    async changeStatus(status: 'Enable' | 'Disable') {
        await this.selectCreateStatus(status);
        await this.save();
    }

    async expectStatusInList(account: string, status: 'Enable' | 'Disable') {
        const row = this.rowByAccount(account);
        const statusSwitch = row.getByRole('switch');

        if (status === 'Enable') {
        await expect(statusSwitch).toHaveAttribute('aria-checked', 'true');
        } else {
        await expect(statusSwitch).toHaveAttribute('aria-checked', 'false');
        }
    }

    async expectStatusSwitch(account: string, enabled: boolean) {
        const row = this.rowByAccount(account);
        const statusSwitch = row.getByRole('switch');

        await expect(statusSwitch).toHaveAttribute(
            'aria-checked',
            enabled ? 'true' : 'false'
        );
    }

    async expectLastLoginUpdated(account: string) {
        const row = this.rowByAccount(account);
        const lastLoginCell = row.locator('td').nth(2);

        await expect(lastLoginCell).not.toHaveText('-');
    }

    async expectLastLoginIpUpdated(account: string) {
        const row = this.rowByAccount(account);
        const lastLoginIpCell = row.locator('td').nth(3);

        await expect(lastLoginIpCell).not.toHaveText('-');
    }
}