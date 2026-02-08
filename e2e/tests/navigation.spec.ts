import { test, expect, type Route } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1, TOTAL_VIDEOS_WITH_FORMAT } from '../helpers/test-data';

const videosListPattern = /\/api\/v1\/videos(\?|$)/;

async function paginateRoute(route: Route) {
  const url = new URL(route.request().url());
  const currentPage = Number(url.searchParams.get('page') || '1');

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

test.describe('N: ナビゲーション・ページ遷移', () => {
  test('N-1: 動画カードクリックで詳細ページへ遷移', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first().click();
    await expect(page).toHaveURL(`/videos/${VIDEO_1.id}`);
    await expect(page.locator('h1')).toContainText(VIDEO_1.title);
  });

  test('N-2: 動画タイトルクリックで詳細ページへ遷移', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first().click();
    await expect(page).toHaveURL(`/videos/${VIDEO_1.id}`);
  });

  test('N-3: ブラウザバックで一覧ページに戻る', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first().click();
    await expect(page).toHaveURL(`/videos/${VIDEO_1.id}`);
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('N-4: 存在しない動画IDへのアクセス', async ({ page }) => {
    await page.goto('/videos/nonexistent');
    // VideoDetailPage は video が null の場合 null を返す（何も表示されない）
    // エラー状態が表示され、クラッシュしないことを確認
    await page.waitForTimeout(2000);
    // h1 が存在しないことを確認（VideoDetailPage は video === null のとき null を返す）
    await expect(page.locator('h1')).toHaveCount(0);
  });

  test('N-5: SPA フォールバック', async ({ page }) => {
    // 直接 URL にアクセス（サーバーサイドの SPA フォールバック）
    await page.goto(`/videos/${VIDEO_1.id}`);
    await expect(page.locator('h1')).toContainText(VIDEO_1.title);
  });

  test('N-6: ブラウザバックで2ページ目のページネーション状態が維持される', async ({ page }) => {
    await page.route(videosListPattern, (route) => paginateRoute(route));

    // 1ページ目 → 「次へ」で2ページ目へ
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.getByText(`1 / ${TOTAL_VIDEOS_WITH_FORMAT}`)).toBeVisible();

    await page.locator(SELECTORS.nextButton).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(`2 / ${TOTAL_VIDEOS_WITH_FORMAT}`)).toBeVisible();

    // 2ページ目から動画詳細へ遷移
    const videoLink = page.locator('a[href^="/videos/"]').first();
    await videoLink.click();
    await expect(page).toHaveURL(/\/videos\//);

    // ブラウザバックで一覧に戻る
    await page.goBack();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(`2 / ${TOTAL_VIDEOS_WITH_FORMAT}`)).toBeVisible();
  });
});
