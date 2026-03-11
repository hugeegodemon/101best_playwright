import { Page, Locator, expect } from '@playwright/test';
import { BOI18n } from '../../utils/i18n';

export class BOSidebarPage {
  readonly page: Page;
  readonly root: Locator;
  private readonly i18n: BOI18n;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('ul[role="menubar"]').first();
    this.i18n = new BOI18n(page);
  }

  private async menuText(key: string): Promise<string> {
    return this.i18n.t(key);
  }

  private menuContainerByText(name: string): Locator {
    return this.root.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: name }),
    }).first();
  }

  private menuTitleByText(name: string): Locator {
    return this.menuContainerByText(name).locator('.el-sub-menu__title').first();
  }

  async expectMenuVisible(key: string) {
    const name = await this.menuText(key);
    await expect(this.root.locator('span', { hasText: name }).first()).toBeVisible();
  }

  async expectMenuExpanded(key: string) {
    const name = await this.menuText(key);
    await expect(this.menuContainerByText(name)).toHaveAttribute('aria-expanded', 'true');
  }

  async expectMenuCollapsed(key: string) {
    const name = await this.menuText(key);
    await expect(this.menuContainerByText(name)).toHaveAttribute('aria-expanded', 'false');
  }

  async collapseMenu(key: string) {
    const name = await this.menuText(key);
    const menu = this.menuContainerByText(name);
    const expanded = await menu.getAttribute('aria-expanded');

    if (expanded === 'true') {
      await this.menuTitleByText(name).click();
    }

    await this.expectMenuCollapsed(key);
  }

  async expandMenu(key: string) {
    const name = await this.menuText(key);
    const menu = this.menuContainerByText(name);
    const expanded = await menu.getAttribute('aria-expanded');

    if (expanded !== 'true') {
      await this.menuTitleByText(name).click();
    }

    await this.expectMenuExpanded(key);
  }

  async expandNestedMenu(parentKey: string, childKey: string) {
    const parent = await this.menuText(parentKey);
    const child = await this.menuText(childKey);

    await this.expandMenu(parentKey);

    const parentMenu = this.menuContainerByText(parent);
    const childMenu = parentMenu.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: child }),
    }).first();

    const expanded = await childMenu.getAttribute('aria-expanded');

    if (expanded !== 'true') {
      await childMenu.locator('.el-sub-menu__title').first().click();
    }

    await expect(childMenu).toHaveAttribute('aria-expanded', 'true');
  }

  async clickSubMenu(parentKey: string, childKey: string) {
    const parent = await this.menuText(parentKey);
    const child = await this.menuText(childKey);

    await this.expandMenu(parentKey);

    const parentMenu = this.menuContainerByText(parent);
    const childMenu = parentMenu.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: child }),
    }).first();

    await childMenu.click();
  }

  async clickThirdLevelMenu(parentKey: string, childKey: string, grandChildKey: string) {
    const parent = await this.menuText(parentKey);
    const child = await this.menuText(childKey);
    const grandChild = await this.menuText(grandChildKey);

    await this.expandNestedMenu(parentKey, childKey);

    const parentMenu = this.menuContainerByText(parent);
    const childMenu = parentMenu.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: child }),
    }).first();

    const grandChildMenu = childMenu.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: grandChild }),
    }).first();

    await grandChildMenu.click();
  }

  async expectSubMenuVisible(key: string) {
    const name = await this.menuText(key);
    await expect(this.root.locator('span', { hasText: name }).first()).toBeVisible();
  }
}
