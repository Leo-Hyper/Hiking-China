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

  test('publishes a post linked to a standard route', async ({ page }) => {
    await login(page, USERS.user.email);
    const title = `E2E 关联路线 ${Date.now()}`;
    await page.goto('/publish?routeId=1');

    await expect(page.getByLabel('关联路线')).toHaveValue('1');
    await expect(page.getByText(/四姑娘山大峰 · 中级/)).toBeVisible();

    await page.getByPlaceholder('请输入帖子标题').fill(title);
    const editor = page.locator('.ql-editor');
    await editor.click();
    await page.keyboard.type('这篇帖子关联到四姑娘山大峰标准路线。');
    await page.getByRole('button', { name: '从预设图片中选择 ▼' }).click();
    await page.getByTestId('preset-image-0').click();
    await page.getByRole('button', { name: '发布帖子' }).click();

    await expect(page).toHaveURL(/\/forum/);
    await page.getByRole('link', { name: new RegExp(title) }).first().click();
    await expect(page).toHaveURL(/\/post\/\d+/);
    await expect(page.getByText('标准路线')).toBeVisible();
    await expect(page.getByRole('link', { name: /查看完整路线/ })).toHaveAttribute(
      'href',
      '/routes/1'
    );
  });

  test('renders an embedded route map at the stored coordinates', async ({ page, request }) => {
    await login(page, USERS.user.email);
    const token = await page.evaluate(() => localStorage.getItem('hiking_token'));
    const title = `E2E 游记地图 ${Date.now()}`;

    const response = await request.post('http://127.0.0.1:3101/api/posts', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: {
        title,
        content: '<p>内嵌轨迹地图。</p>',
        category: '路线攻略',
        extrainfo: {
          route: {
            difficulty: 2,
            duration: '1天',
            elevationGain: '300m',
            distance: 1.2,
            start: '甲',
            end: '乙',
            coordinates: [[30.6468, 104.395], [30.6321, 104.4194]],
          },
        },
      },
    });
    expect(response.status()).toBe(201);
    const { postId } = await response.json();

    await page.goto(`/post/${postId}`);
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();
    await page.waitForFunction(
      () => document.querySelectorAll('.leaflet-marker-icon').length >= 2
    );

    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(2);
    const box = await map.boundingBox();
    for (const marker of await markers.all()) {
      const markerBox = await marker.boundingBox();
      expect(markerBox!.x).toBeGreaterThan(box!.x);
      expect(markerBox!.y).toBeGreaterThan(box!.y);
      expect(markerBox!.x + markerBox!.width).toBeLessThan(box!.x + box!.width);
      expect(markerBox!.y + markerBox!.height).toBeLessThan(box!.y + box!.height);
    }

    const maxTileZoom = await page.evaluate(() => {
      const zooms = Array.from(document.querySelectorAll('.leaflet-tile')).map((tile) => {
        const match = (tile as HTMLImageElement).src.match(/\/(\d+)\/\d+\/\d+\.png/);
        return match ? Number(match[1]) : 0;
      });
      return Math.max(0, ...zooms);
    });
    expect(maxTileZoom).toBeGreaterThanOrEqual(8);
  });
});
