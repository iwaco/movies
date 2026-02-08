import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { ALL_VIDEOS } from '../helpers/test-data';

/** カード数をカウントするセレクタ（各カードに img が1つ） */
const cardImg = '.grid a[href^="/videos/"] img';

test.describe('SF: 星フィルタ', () => {
  // 各テスト前にテストデータの評価を設定
  test.beforeEach(async ({ request }) => {
    // まず全削除
    for (const video of ALL_VIDEOS) {
      await request.delete(`http://localhost:18080/api/v1/ratings/${video.id}`).catch(() => {});
    }
    // video-1: rating 5, video-2: rating 3
    await request.put('http://localhost:18080/api/v1/ratings/video-1', {
      data: { rating: 5 },
    });
    await request.put('http://localhost:18080/api/v1/ratings/video-2', {
      data: { rating: 3 },
    });
  });

  test('SF-1: 星フィルタの初期状態（5つの星が表示、フィルタ未適用）', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const starFilter = page.locator(SELECTORS.starFilter);
    await expect(starFilter).toBeVisible();
    const stars = starFilter.locator('button');
    await expect(stars).toHaveCount(5);
    // All filter stars should be unpressed
    for (let i = 0; i < 5; i++) {
      await expect(stars.nth(i)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('SF-2: 星3をクリックすると rating >= 3 の動画のみ表示', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const starFilter = page.locator(SELECTORS.starFilter);
    const stars = starFilter.locator('button');
    await stars.nth(2).click(); // Star 3
    // video-1 (rating 5) and video-2 (rating 3) should be visible, video-3 (no rating) should not
    await expect(page.locator(cardImg)).toHaveCount(2);
    await expect(page.locator(`a[href="/videos/video-1"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/video-2"]`).first()).toBeVisible();
  });

  test('SF-3: 同じ星を再クリックでフィルタ解除', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const starFilter = page.locator(SELECTORS.starFilter);
    const stars = starFilter.locator('button');

    // フィルタ適用
    await stars.nth(2).click();
    await expect(page.locator(cardImg)).toHaveCount(2);

    // フィルタ解除（同じ星を再クリック）
    await stars.nth(2).click();
    // デフォルトは has_video=true なので video-1 と video-2 が表示
    await expect(page.locator(cardImg)).toHaveCount(2);
    // フィルタスターが全て unpressed
    for (let i = 0; i < 5; i++) {
      await expect(stars.nth(i)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('SF-4: URLに min_rating パラメータが反映される', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const starFilter = page.locator(SELECTORS.starFilter);
    const stars = starFilter.locator('button');
    await stars.nth(2).click();
    await expect(page).toHaveURL(/min_rating=3/);
  });

  test('SF-5: URL ?min_rating=3 からの状態復元', async ({ page }) => {
    await page.goto('/?min_rating=3');
    await page.waitForSelector(SELECTORS.searchInput);
    const starFilter = page.locator(SELECTORS.starFilter);
    const stars = starFilter.locator('button');
    // First 3 filter stars should be pressed
    await expect(stars.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(stars.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(stars.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(stars.nth(3)).toHaveAttribute('aria-pressed', 'false');
    await expect(stars.nth(4)).toHaveAttribute('aria-pressed', 'false');
  });

  test('SF-6: フィルタ変更時にページが1にリセットされる', async ({ page }) => {
    // per_page=1 で複数ページをシミュレート
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
    const starFilter = page.locator(SELECTORS.starFilter);
    const stars = starFilter.locator('button');
    await stars.nth(2).click();
    const url = new URL(page.url());
    const pageParam = url.searchParams.get('page');
    expect(pageParam === null || pageParam === '1').toBeTruthy();
  });
});
