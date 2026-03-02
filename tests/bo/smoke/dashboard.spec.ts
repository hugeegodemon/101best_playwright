import { test, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';

test('dashboard page opens', async ({ page }) => {
  await page.goto(`${ENV.SBO_URL}/dashboard`);
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText(/Home/i)).toBeVisible();
});