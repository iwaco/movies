import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { TOTAL_VIDEOS, TOTAL_VIDEOS_WITH_FORMAT, VIDEO_1, VIDEO_2, VIDEO_3 } from '../helpers/test-data';

/** カード数をカウントするセレクタ（各カードに img が1つ） */
const cardImg = '.grid a[href^="/videos/"] img';

test.describe('HV: 動画フォーマットフィルタ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
  });

  test('HV-1: デフォルトでクラウドアイコンがOFF状態（動画のみ表示中）', async ({ page }) => {
    await expect(page.locator('button[aria-label="動画のみ表示中"]')).toBeVisible();
  });

  test('HV-2: デフォルトでフォーマット付き動画のみ表示される', async ({ page }) => {
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS_WITH_FORMAT);
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).not.toBeVisible();
  });

  test('HV-3: クラウドアイコンをクリックするとONになり全動画が表示される', async ({ page }) => {
    await page.locator('button[aria-label="動画のみ表示中"]').click();
    await expect(page.locator('button[aria-label="全て表示中"]')).toBeVisible();
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS);
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).toBeVisible();
  });

  test('HV-4: 再度クリックでOFFに戻り動画のみ表示', async ({ page }) => {
    await page.locator('button[aria-label="動画のみ表示中"]').click();
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS);

    await page.locator('button[aria-label="全て表示中"]').click();
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS_WITH_FORMAT);
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).not.toBeVisible();
  });

  test('HV-5: ON時にURLに has_video=false が反映される', async ({ page }) => {
    await page.locator('button[aria-label="動画のみ表示中"]').click();
    await expect(page.locator('button[aria-label="全て表示中"]')).toBeVisible();
    await expect(page).toHaveURL(/has_video=false/);
  });

  test('HV-6: OFF時にURLに has_video パラメータがない', async ({ page }) => {
    const url = new URL(page.url());
    expect(url.searchParams.has('has_video')).toBeFalsy();
  });

  test('HV-7: has_video=false のURLから状態が復元される', async ({ page }) => {
    await page.goto('/?has_video=false');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator('button[aria-label="全て表示中"]')).toBeVisible();
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS);
  });

  test('HV-8: フィルタ変更時にページが1にリセットされる', async ({ page }) => {
    // per_page=1 で複数ページをシミュレート（page=2 を有効にする）
    await page.route(/\/api\/v1\/videos(\?|$)/, async (route) => {
      const url = new URL(route.request().url());
      const currentPage = Number(url.searchParams.get('page') || '1');
      const fetchUrl = new URL(url.toString());
      fetchUrl.searchParams.set('page', '1');
      const response = await route.fetch({ url: fetchUrl.toString() });
      const json = await response.json();
      const items = json.data || [];
      const total = items.length;
      const start = (currentPage - 1);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...json, data: items.slice(start, start + 1), page: currentPage, per_page: 1, total, total_pages: total,
        }),
      });
    });

    await page.goto('/?page=2');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.locator('button[aria-label="動画のみ表示中"]').click();
    const url = new URL(page.url());
    const pageParam = url.searchParams.get('page');
    expect(pageParam === null || pageParam === '1').toBeTruthy();
  });
});
