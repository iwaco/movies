import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1, VIDEO_2, TOTAL_VIDEOS_WITH_FORMAT } from '../helpers/test-data';

/** カード数をカウントするセレクタ（各カードに img が1つ） */
const cardImg = '.grid a[href^="/videos/"] img';

test.describe('S: 検索', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
  });

  test('S-1: キーワード検索で一致する動画が表示される', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, 'サンプル');
    await page.waitForTimeout(500);
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).not.toBeVisible();
  });

  test('S-2: 検索結果が0件の場合の表示', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, '存在しない');
    await page.waitForTimeout(500);
    await expect(page.locator(cardImg)).toHaveCount(0);
  });

  test('S-3: 検索クエリをクリアすると全件表示に戻る', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, 'サンプル');
    await page.waitForTimeout(500);

    await page.fill(SELECTORS.searchInput, '');
    await page.waitForTimeout(500);
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS_WITH_FORMAT);
  });

  test('S-4: 検索がデバウンスされる（300ms）', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/videos') && req.url().includes('q=')) {
        requests.push(req.url());
      }
    });

    // 素早く入力
    await page.locator(SELECTORS.searchInput).pressSequentially('テスト', { delay: 50 });

    // 入力直後はまだリクエストが少ない（デバウンス中）
    const earlyCount = requests.length;

    // 300ms 以上待つとリクエストが発行される
    await page.waitForTimeout(500);
    expect(requests.length).toBeGreaterThan(earlyCount);
  });

  test('S-5: 検索時にページが1にリセットされる', async ({ page }) => {
    // page=2 に直接アクセスするとデータなし(data:null)で React がクラッシュするため、
    // route intercept で per_page=1 の複数ページをシミュレートする
    await page.route(/\/api\/v1\/videos(\?|$)/, async (route) => {
      const url = new URL(route.request().url());
      const currentPage = Number(url.searchParams.get('page') || '1');
      const q = url.searchParams.get('q') || '';

      // 常に page=1 で全件を取得
      const fetchUrl = new URL(url.toString());
      fetchUrl.searchParams.set('page', '1');
      const response = await route.fetch({ url: fetchUrl.toString() });
      const json = await response.json();

      const items = json.data || [];
      if (q) {
        // 検索時はそのまま返す
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
      } else {
        // 検索なしの場合: per_page=1 でページングをシミュレート
        const perPage = 1;
        const total = items.length;
        const totalPages = Math.max(1, total);
        const start = (currentPage - 1) * perPage;
        const paged = items.slice(start, start + perPage);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...json, data: paged, page: currentPage, per_page: perPage, total, total_pages: totalPages,
          }),
        });
      }
    });

    await page.goto('/?page=2');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.fill(SELECTORS.searchInput, 'テスト');
    await page.waitForTimeout(500);
    const url = new URL(page.url());
    const pageParam = url.searchParams.get('page');
    expect(pageParam === null || pageParam === '1').toBeTruthy();
  });

  test('S-6: 出演者名で検索できる', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, '出演者A');
    await page.waitForTimeout(500);
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
  });

  test('S-7: タグ名で検索できる', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, 'タグ3');
    await page.waitForTimeout(500);
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).toBeVisible();
  });
});
