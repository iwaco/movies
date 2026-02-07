import { test, expect, type Route } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { TOTAL_VIDEOS_WITH_FORMAT } from '../helpers/test-data';

/** API レスポンスを per_page=1 に上書きするルートハンドラ。
 * route.fetch() は常に page=1 で全件取得し、クライアント側でスライスする */
async function paginateRoute(route: Route, opts?: { passthrough?: (url: URL) => boolean }) {
  const url = new URL(route.request().url());

  // passthrough 条件に合致する場合はそのまま返す
  if (opts?.passthrough?.(url)) {
    const response = await route.fetch();
    const json = await response.json();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    return;
  }

  const currentPage = Number(url.searchParams.get('page') || '1');

  // 常に page=1 で全件を取得
  const fetchUrl = new URL(url.toString());
  fetchUrl.searchParams.set('page', '1');
  fetchUrl.searchParams.delete('per_page');
  const response = await route.fetch({ url: fetchUrl.toString() });
  const json = await response.json();

  const items = json.data || [];
  const perPage = 1;
  const total = items.length;
  const totalPages = Math.max(1, total);
  const start = (currentPage - 1) * perPage;
  const paged = items.slice(start, start + perPage);

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ...json,
      data: paged,
      page: currentPage,
      per_page: perPage,
      total,
      total_pages: totalPages,
    }),
  });
}

/** /api/v1/videos のリスト API のみマッチ（詳細 /api/v1/videos/:id は除外） */
const videosListPattern = /\/api\/v1\/videos(\?|$)/;

test.describe('P: ページネーション', () => {
  test('P-1: ページ番号の表示', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.getByText('1 / 1')).toBeVisible();
  });

  test('P-2: 次ページへ遷移', async ({ page }) => {
    await page.route(videosListPattern, (route) => paginateRoute(route));

    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.getByText(`1 / ${TOTAL_VIDEOS_WITH_FORMAT}`)).toBeVisible();

    await page.locator(SELECTORS.nextButton).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(`2 / ${TOTAL_VIDEOS_WITH_FORMAT}`)).toBeVisible();
  });

  test('P-3: 前ページへ遷移', async ({ page }) => {
    await page.route(videosListPattern, (route) => paginateRoute(route));

    await page.goto('/?page=2');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.getByText(`2 / ${TOTAL_VIDEOS_WITH_FORMAT}`)).toBeVisible();

    await page.locator(SELECTORS.prevButton).click();
    await expect(page.getByText(`1 / ${TOTAL_VIDEOS_WITH_FORMAT}`)).toBeVisible();
  });

  test('P-4: 1ページ目で「前へ」が無効', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator(SELECTORS.prevButton)).toBeDisabled();
  });

  test('P-5: 最終ページで「次へ」が無効', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator(SELECTORS.nextButton)).toBeDisabled();
  });

  test('P-6: フィルタ適用後のページネーション', async ({ page }) => {
    await page.route(videosListPattern, (route) =>
      paginateRoute(route, {
        passthrough: (url) => !!url.searchParams.get('tag'),
      }),
    );

    await page.goto('/?page=2');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.getByText(`2 / ${TOTAL_VIDEOS_WITH_FORMAT}`)).toBeVisible();

    // タグフィルタ適用でページリセット
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await expect(page.getByText('1 / 1')).toBeVisible();
  });
});
