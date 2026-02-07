import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1, VIDEO_2, VIDEO_3, TOTAL_VIDEOS_WITH_FORMAT } from '../helpers/test-data';

/** カード数をカウントするセレクタ（各カードに img が1つ） */
const cardImg = '.grid a[href^="/videos/"] img';

test.describe('F: フィルタリング（タグ・出演者）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
  });

  test('F-1: タグフィルタの初期状態', async ({ page }) => {
    await expect(page.locator(SELECTORS.tagFilter)).toHaveValue('');
  });

  test('F-2: タグで絞り込み', async ({ page }) => {
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).not.toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).not.toBeVisible();
  });

  test('F-3: タグフィルタをリセット', async ({ page }) => {
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await expect(page.locator(cardImg)).toHaveCount(1);

    await page.selectOption(SELECTORS.tagFilter, '');
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS_WITH_FORMAT);
  });

  test('F-4: タグフィルタのオプション一覧', async ({ page }) => {
    const options = page.locator(`${SELECTORS.tagFilter} option`);
    await expect(options).toHaveCount(4); // すべて + タグ1, タグ2, タグ3
    await expect(options.nth(0)).toHaveText('すべて');
  });

  test('F-5: 出演者フィルタの初期状態', async ({ page }) => {
    await expect(page.locator(SELECTORS.actorFilter)).toHaveValue('');
  });

  test('F-6: 出演者で絞り込み', async ({ page }) => {
    await page.selectOption(SELECTORS.actorFilter, '出演者C');
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).not.toBeVisible();
  });

  test('F-7: 出演者フィルタをリセット', async ({ page }) => {
    await page.selectOption(SELECTORS.actorFilter, '出演者C');
    await expect(page.locator(cardImg)).toHaveCount(1);

    await page.selectOption(SELECTORS.actorFilter, '');
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS_WITH_FORMAT);
  });

  test('F-8: 出演者フィルタのオプション一覧', async ({ page }) => {
    const options = page.locator(`${SELECTORS.actorFilter} option`);
    await expect(options).toHaveCount(4); // すべて + 出演者A, 出演者B, 出演者C
    await expect(options.nth(0)).toHaveText('すべて');
  });

  test('F-9: フィルタ変更時にページが1にリセットされる', async ({ page }) => {
    // page=2 に直接アクセスするとデータなし(data:null)でクラッシュするため、
    // route intercept で per_page=1 の複数ページをシミュレートする
    await page.route(/\/api\/v1\/videos(\?|$)/, async (route) => {
      const url = new URL(route.request().url());
      const currentPage = Number(url.searchParams.get('page') || '1');
      const tag = url.searchParams.get('tag') || '';

      // 常に page=1 で全件を取得
      const fetchUrl = new URL(url.toString());
      fetchUrl.searchParams.set('page', '1');
      const response = await route.fetch({ url: fetchUrl.toString() });
      const json = await response.json();

      const items = json.data || [];
      if (tag) {
        // タグフィルタ時はそのまま返す
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
      } else {
        // フィルタなしの場合: per_page=1 でページングをシミュレート
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
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    const url = new URL(page.url());
    const pageParam = url.searchParams.get('page');
    expect(pageParam === null || pageParam === '1').toBeTruthy();
  });

  test('F-10: タグが0件の動画はタグフィルタで除外される', async ({ page }) => {
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).not.toBeVisible();
  });

  test('F-11: 出演者が0人の動画は出演者フィルタで除外される', async ({ page }) => {
    await page.selectOption(SELECTORS.actorFilter, '出演者A');
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).not.toBeVisible();
  });
});
