import { expect, test } from '@playwright/test';
import { login, USERS } from './fixtures';

test.describe('event signup', () => {
  test('join and cancel an event', async ({ page }) => {
    await login(page, USERS.user.email);
    await page.goto('/events');
    await page.getByRole('button', { name: '下一页' }).click();

    const card = page.locator('a').filter({ hasText: 'E2E 周末徒步' }).first();
    await expect(card).toBeVisible();

    await card.getByRole('button', { name: '立即报名' }).click();
    await expect(page.getByText('报名成功')).toBeVisible();
    await expect(card.getByRole('button', { name: '取消报名' })).toBeVisible();

    await card.getByRole('button', { name: '取消报名' }).click();
    await expect(page.getByText('已取消报名')).toBeVisible();
  });

  test('a full event cannot be joined', async ({ page }) => {
    await login(page, USERS.user.email);
    await page.goto('/events');
    await page.getByRole('button', { name: '下一页' }).click();

    const card = page.locator('a').filter({ hasText: 'E2E 满员活动' }).first();
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: '已满员' })).toBeDisabled();
  });
});
