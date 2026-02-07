import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1 } from '../helpers/test-data';

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
});
