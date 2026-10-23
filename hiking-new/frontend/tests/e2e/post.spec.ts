import { expect, test } from '@playwright/test';
import { login, USERS } from './fixtures';

test.describe('post lifecycle', () => {
  test('publish, comment, like and bookmark a post', async ({ page }) => {
    await login(page, USERS.user.email);

    const title = `E2E 发布 ${Date.now()}`;
    await page.goto('/publish');
    await page.getByPlaceholder('请输入帖子标题').fill(title);

    const editor = page.locator('.ql-editor');
    await editor.click();
    await page.keyboard.type('这是一篇 E2E 自动化测试发布的帖子。');

    await page.getByRole('button', { name: '从预设图片中选择 ▼' }).click();
    await page.getByTestId('preset-image-0').click();
    await page.getByRole('button', { name: '发布帖子' }).click();

    await expect(page).toHaveURL(/\/forum/);
    await page.getByRole('link', { name: new RegExp(title) }).first().click();
    await expect(page).toHaveURL(/\/post\/\d+/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.getByPlaceholder('写下你的想法...').fill('E2E 评论内容');
    await page.getByRole('button', { name: '发表评论' }).click();
    await expect(page.getByText('E2E 评论内容')).toBeVisible();

    await page.getByRole('button', { name: '点赞' }).click();
    await expect(page.getByRole('button', { name: '取消点赞' })).toBeVisible();

    await page.getByRole('button', { name: '收藏' }).click();
    await expect(page.getByRole('button', { name: '已收藏' })).toBeVisible();

    await page.goto('/profile?tab=bookmarks');
    await expect(page.getByText(title)).toBeVisible();
  });
});
