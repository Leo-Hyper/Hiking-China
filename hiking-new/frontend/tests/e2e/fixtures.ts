import { expect, type Page } from '@playwright/test';

export const TEST_PASSWORD = 'E2ePassw0rd!';

export const USERS = {
  user: { email: 'e2e-user@example.com', password: TEST_PASSWORD },
  other: { email: 'e2e-other@example.com', password: TEST_PASSWORD },
  admin: { email: 'e2e-admin@example.com', password: TEST_PASSWORD },
};

export async function login(page: Page, email: string, password = TEST_PASSWORD): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('请输入密码').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: '账户菜单' })).toBeVisible();

  const token = await page.evaluate(() => localStorage.getItem('hiking_token'));
  expect(token).toBeTruthy();
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: '账户菜单' }).click();
  await page.getByRole('menuitem', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/login/);
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}
