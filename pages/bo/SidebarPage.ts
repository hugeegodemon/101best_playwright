import { Page, Locator, expect } from '@playwright/test';

export class BOSidebarPage {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('ul[role="menubar"]').first();
  }

  private menuContainerByText(name: string): Locator {
    return this.root.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: name }),
    }).first();
  }

  private menuTitleByText(name: string): Locator {
    return this.menuContainerByText(name).locator('.el-sub-menu__title').first();
  }

  async expectMenuVisible(name: string) {
    await expect(this.root.locator('span', { hasText: name }).first()).toBeVisible();
  }

  async expectMenuExpanded(name: string) {
    await expect(this.menuContainerByText(name)).toHaveAttribute('aria-expanded', 'true');
  }

  async expectMenuCollapsed(name: string) {
    await expect(this.menuContainerByText(name)).toHaveAttribute('aria-expanded', 'false');
  }
  async collapseMenu(name: string) {
    const menu = this.menuContainerByText(name);
    const expanded = await menu.getAttribute('aria-expanded');

    if (expanded === 'true') {
        await this.menuTitleByText(name).click();
    }

    await this.expectMenuCollapsed(name);
  }
  async expandMenu(name: string) {
    const menu = this.menuContainerByText(name);
    const expanded = await menu.getAttribute('aria-expanded');

    if (expanded !== 'true') {
      await this.menuTitleByText(name).click();
    }

    await this.expectMenuExpanded(name);
  }

  async expandNestedMenu(parent: string, child: string) {
    await this.expandMenu(parent);

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

  async clickSubMenu(parent: string, child: string) {
    await this.expandMenu(parent);

    const parentMenu = this.menuContainerByText(parent);
    const childMenu = parentMenu.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: child }),
    }).first();

    await childMenu.click();
  }

  async clickThirdLevelMenu(parent: string, child: string, grandChild: string) {
    await this.expandNestedMenu(parent, child);

    const parentMenu = this.menuContainerByText(parent);
    const childMenu = parentMenu.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: child }),
    }).first();

    const grandChildMenu = childMenu.locator('li[role="menuitem"]').filter({
      has: this.page.locator('span', { hasText: grandChild }),
    }).first();

    await grandChildMenu.click();
  }

  async expectSubMenuVisible(name: string) {
    await expect(this.root.locator('span', { hasText: name }).first()).toBeVisible();
  }
}