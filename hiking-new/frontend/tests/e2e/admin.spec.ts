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

  test('admin can link a post to a route one by one', async ({ page }) => {
    await login(page, USERS.admin.email);
    await page.goto('/admin/route-links');

    await expect(page.getByRole('heading', { name: '帖子路线归属' })).toBeVisible();
    page.on('dialog', (dialog) => void dialog.accept());

    const suggestionArticle = page.locator('article').filter({ hasText: '雨崩冰湖线徒步记录' });
    await expect(suggestionArticle).toBeVisible();
    await expect(suggestionArticle.getByText('雨崩冰湖线', { exact: true })).toBeVisible();
    await expect(suggestionArticle.getByText(/高置信度/)).toBeVisible();
    const suggestionRow = suggestionArticle
      .locator('div.rounded-lg.border')
      .filter({ hasText: '雨崩冰湖线' })
      .first();
    await suggestionRow.getByRole('button', { name: '采用' }).click();
    await expect(page.getByText('路线关联已保存').last()).toBeVisible();
    await expect(suggestionArticle).toHaveCount(0);

    const article = page.locator('article').filter({ hasText: 'E2E 周末结伴同行' });
    await expect(article).toBeVisible();
    await expect(article.getByText('暂无高置信度建议，可在下方手动选择路线。')).toBeVisible();

    await article.locator('select').selectOption('1');
    await article.getByRole('button', { name: '关联所选路线' }).click();

    await expect(page.getByText('路线关联已保存').last()).toBeVisible();
    await expect(
      page.locator('article').filter({ hasText: 'E2E 周末结伴同行' })
    ).toHaveCount(0);
  });
});
