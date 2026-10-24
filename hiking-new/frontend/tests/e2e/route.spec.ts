import { expect, test } from '@playwright/test';
import { login, USERS } from './fixtures';

const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="E2E" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>E2E Track</name>
    <trkseg>
      <trkpt lat="31.002" lon="102.901"><ele>3000</ele></trkpt>
      <trkpt lat="31.051" lon="102.933"><ele>3050</ele></trkpt>
      <trkpt lat="31.109" lon="102.968"><ele>3100</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

test.describe('route detail and GPX', () => {
  test('opens an OSM route, shows real track data and persists favorite', async ({ page }) => {
    await login(page, USERS.user.email);
    await page.goto('/routes');

    await page.getByRole('link', { name: /虎跳峡高路徒步/ }).first().click();
    await expect(page).toHaveURL(/\/routes\/2/);
    await expect(page.getByRole('heading', { name: '虎跳峡高路徒步' })).toBeVisible();
    await expect(page.getByText('路线轨迹')).toBeVisible();
    await expect(page.getByText('海拔剖面')).toBeVisible();
    await expect(page.getByText('OSM 路径 · SRTM 高程')).toBeVisible();
    await expect(page.getByRole('link', { name: '导出 GPX' })).toHaveAttribute(
      'href',
      /\/api\/routes\/2\/export\.gpx/
    );
    await expect(page.locator('.maplibregl-canvas')).toBeVisible();

    const elevation = page.getByRole('img', { name: '路线海拔剖面图' });
    await expect(elevation).toBeVisible();
    await elevation.hover({ position: { x: 420, y: 120 } });
    await expect(page.getByText(/坡度/)).toBeVisible();

    await page.getByRole('button', { name: '收藏路线' }).click();
    await expect(page.getByRole('button', { name: '已收藏' })).toBeVisible();

    await page.goto('/profile?tab=routes');
    await expect(page.getByText('虎跳峡高路徒步')).toBeVisible();
  });

  test('shows an honest empty state when a route has no GPX', async ({ page }) => {
    await page.goto('/routes/1');
    await expect(page.getByRole('heading', { name: '四姑娘山大峰' })).toBeVisible();
    await expect(page.getByText('该路线暂未上传 GPX 轨迹')).toBeVisible();
    await expect(page.getByText('该路线暂无海拔数据')).toBeVisible();
    await expect(page.getByText('示例轨迹 · 非实测')).toHaveCount(0);
    await expect(page.getByRole('link', { name: '导出 GPX' })).toHaveCount(0);
  });

  test('parses a GPX upload and returns route statistics', async ({ page, request }) => {
    await login(page, USERS.user.email);
    const token = await page.evaluate(() => localStorage.getItem('hiking_token'));

    const response = await request.post('http://127.0.0.1:3101/api/routes/parse-gpx', {
      headers: {
        'Content-Type': 'text/plain',
        Authorization: `Bearer ${token}`,
      },
      data: SAMPLE_GPX,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.name).toBe('E2E Track');
    expect(body.stats.pointCount).toBe(3);
    expect(body.stats.maxElevation).toBe(3100);
    expect(body.stats.distance).toBeGreaterThan(0);
    expect(Array.isArray(body.geojson.coordinates)).toBeTruthy();
  });

  test('admin can create and delete a route', async ({ page }) => {
    await login(page, USERS.admin.email);
    await page.goto('/admin/routes');

    await expect(page.getByText('路线库')).toBeVisible();
    const name = `E2E 管理路线 ${Date.now()}`;
    await page.getByPlaceholder('例如：四姑娘山大峰').fill(name);
    await page.getByRole('button', { name: '创建路线' }).click();

    await expect(page.getByText('路线已创建')).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();

    page.on('dialog', (dialog) => void dialog.accept());
    const row = page.locator('tr').filter({ hasText: name });
    await row.getByRole('button', { name: '删除' }).click();
    await expect(page.getByText('路线已删除')).toBeVisible();
  });

  test('rejects an invalid GPX payload', async ({ page, request }) => {
    await login(page, USERS.user.email);
    const token = await page.evaluate(() => localStorage.getItem('hiking_token'));

    const response = await request.post('http://127.0.0.1:3101/api/routes/parse-gpx', {
      headers: {
        'Content-Type': 'text/plain',
        Authorization: `Bearer ${token}`,
      },
      data: '<gpx><trk><trkseg></trkseg></trk></gpx>',
    });

    expect(response.status()).toBe(400);
  });

  test('shows a real companion count instead of a hard-coded number', async ({ page }) => {
    await page.goto('/routes');
    await expect(page.getByText(/近 30 天有\s*[1-9]\d*\s*人寻找同行者/)).toBeVisible();
    await expect(page.getByText('已有 6 人寻找同行者')).toHaveCount(0);
  });

});
