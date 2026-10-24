import { expect, test } from '@playwright/test';

test.describe('home sections', () => {
  test('the featured hot route links to the route detail', async ({ page }) => {
    await page.goto('/');
    const featured = page.locator('a[href="/routes/1"]').first();
    await expect(featured).toBeVisible();
    await expect(featured).toHaveAttribute('href', '/routes/1');
    await featured.click();
    await expect(page).toHaveURL(/\/routes\/1$/);
    await expect(page.getByRole('heading', { name: '四姑娘山大峰' })).toBeVisible();
  });
});
