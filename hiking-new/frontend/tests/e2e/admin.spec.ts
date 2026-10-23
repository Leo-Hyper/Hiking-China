import { expect, test } from '@playwright/test';
import { login, USERS } from './fixtures';

test.describe('admin console', () => {
  test('admin can open the report queue and resolve a report', async ({ page }) => {
    await login(page, USERS.admin.email);
    await page.goto('/admin');

    const reportsTab = page.getByRole('link', { name: '举报', exact: true });
    await expect(reportsTab).toBeVisible();
    await reportsTab.click();
    await expect(page).toHaveURL(/\/admin\/reports/);
    await expect(page.getByText('广告').first()).toBeVisible();

    await page.getByRole('button', { name: '处理' }).first().click();
    await expect(page.getByText('举报已处理')).toBeVisible();
  });
});
