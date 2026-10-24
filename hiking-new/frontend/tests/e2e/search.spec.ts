import { expect, test } from '@playwright/test';

test.describe('search', () => {
  test('routes from the API are searchable and open the detail page', async ({ page }) => {
    await page.goto('/');
    await page.getByTitle('搜索 (Ctrl+K)').click();
    await page.getByPlaceholder('搜索路线、装备、经验...').fill('雨崩');

    const routeLink = page.locator('a[href="/routes/12"]');
    await expect(routeLink).toBeVisible();
    await expect(page.getByText('路线 (')).toBeVisible();

    await routeLink.click();
    await expect(page).toHaveURL(/\/routes\/12$/);
    await expect(page.getByRole('heading', { name: '雨崩冰湖线' })).toBeVisible();
  });

  test('gear stays searchable without static post data', async ({ page }) => {
    await page.goto('/');
    await page.getByTitle('搜索 (Ctrl+K)').click();
    await page.getByPlaceholder('搜索路线、装备、经验...').fill('Osprey');
    await expect(page.locator('a[href="/gear"]').first()).toBeVisible();
  });
});
