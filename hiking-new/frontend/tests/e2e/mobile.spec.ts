import { expect, test } from '@playwright/test';
import { login, USERS } from './fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('mobile navigation', () => {
  test('bottom navigation works and profile does not overflow horizontally', async ({ page }) => {
    await page.goto('/');

    const tabBar = page.locator('nav.fixed');
    await expect(tabBar).toBeVisible();

    await tabBar.getByRole('link', { name: '路线' }).click();
    await expect(page).toHaveURL(/\/routes/);

    await tabBar.getByRole('link', { name: '活动' }).click();
    await expect(page).toHaveURL(/\/events/);

    await login(page, USERS.user.email);
    await page.goto('/profile');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
