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

  test('register verifies email with a 6-digit code and signs in immediately', async ({ page }) => {
    await page.goto('/register');

    await page.getByPlaceholder('2-20个字符').fill('E2ENewUser');
    const email = uniqueEmail('e2e-register');
    await page.getByPlaceholder('your@email.com').fill(email);
    await page.getByPlaceholder('8-72个字符').fill(TEST_PASSWORD);

    const registerResponse = page.waitForResponse(
      (response) => response.url().includes('/api/auth/register') && response.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    const body = await (await registerResponse).json();

    await expect(page.getByText(/注册成功/)).toBeVisible();
    await expect(page.getByPlaceholder('000000')).toBeVisible();
    expect(body.dev_verification_code).toMatch(/^\d{6}$/);

    await page.getByPlaceholder('000000').fill(body.dev_verification_code);
    await page.getByRole('button', { name: '验证并进入' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: '账户菜单' })).toBeVisible();
    const token = await page.evaluate(() => localStorage.getItem('hiking_token'));
    expect(token).toBeTruthy();

    await page.goto('/publish');
    await expect(page.getByRole('heading', { name: '发布帖子' })).toBeVisible();

    const replay = await page.request.post('http://127.0.0.1:3101/api/auth/verify-email-code', {
      data: { email, code: body.dev_verification_code },
    });
    expect(replay.status()).toBe(409);
    const replayBody = await replay.json();
    expect(replayBody.token).toBeFalsy();
  });
});
