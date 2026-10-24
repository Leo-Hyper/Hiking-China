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

  test('hot route covers match the route detail images', async ({ page }) => {
    await page.goto('/');
    const featuredImage = page.locator('a[href="/routes/1"] img').first();
    await expect(featuredImage).toBeVisible();
    const homeFeaturedSrc = await featuredImage.getAttribute('src');

    for (const cover of ['yading-butu', 'yubeng-cun', 'huangshan']) {
      await expect(page.locator(`img[src*="${cover}"]`).first()).toBeVisible();
    }

    await page.goto('/routes/1');
    const detailSrc = await page.locator('main img[src*="/img/"]').first().getAttribute('src');
    expect(homeFeaturedSrc).toBe(detailSrc);
  });
});
