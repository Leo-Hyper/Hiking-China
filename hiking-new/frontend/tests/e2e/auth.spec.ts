import { expect, test } from '@playwright/test';
import { login, logout, TEST_PASSWORD, uniqueEmail, USERS } from './fixtures';

test.describe('authentication', () => {
  test('login persists after reload and logout clears the session', async ({ page }) => {
    await login(page, USERS.user.email);

    await page.reload();
    await expect(page.getByRole('button', { name: '账户菜单' })).toBeVisible();

    const tokenBeforeLogout = await page.evaluate(() => localStorage.getItem('hiking_token'));
    expect(tokenBeforeLogout).toBeTruthy();

    await logout(page);

    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('hiking_token'));
    expect(tokenAfterLogout).toBeFalsy();
  });

  test('register creates a new account', async ({ page }) => {
    await page.goto('/register');

    await page.getByPlaceholder('2-20个字符').fill('E2ENewUser');
    await page.getByPlaceholder('your@email.com').fill(uniqueEmail('e2e-register'));
    await page.getByPlaceholder('8-72个字符').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText(/注册成功/)).toBeVisible();
  });
});
