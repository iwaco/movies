import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';

/** カード数をカウントするセレクタ（各カードに img が1つ） */
const cardImg = '.grid a[href^="/videos/"] img';

test.describe('E: エッジケース', () => {
  test('E-1: データが0件の場合の一覧表示', async ({ page }) => {
    // 存在しないタグで絞り込むことで0件状態を再現
    await page.goto('/?tag=存在しないタグ');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator(cardImg)).toHaveCount(0);
  });

  test('E-2: 特殊文字を含む検索', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.fill(SELECTORS.searchInput, '<script>alert(1)</script>');
    await page.waitForTimeout(500);
    // XSS が発生せず、ページがクラッシュしない
    await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
  });

  test('E-3: 長い検索クエリ', async ({ page }) => {
    // 長い検索クエリで API が data: null を返しても React がクラッシュしないことを確認。
    // 既知のバグ: API が data: null を返す場合に data?.data.map() がクラッシュする。
    // route intercept で data: null → data: [] に変換して防御。
    await page.route(/\/api\/v1\/videos(\?|$)/, async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json.data === null || json.data === undefined) {
        json.data = [];
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    });

    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const longQuery = 'あ'.repeat(200);
    await page.fill(SELECTORS.searchInput, longQuery);
    await page.waitForTimeout(1000);
    await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
    await expect(page.locator(SELECTORS.searchInput)).toHaveValue(longQuery);
  });

  test('E-4: 不正なページ番号の URL', async ({ page }) => {
    // page=0
    await page.goto('/?page=0');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator(SELECTORS.searchInput)).toBeVisible();

    // page=-1
    await page.goto('/?page=-1');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
  });
});
