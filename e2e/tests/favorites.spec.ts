import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1, ALL_VIDEOS } from '../helpers/test-data';

test.describe('FA: お気に入り', () => {
  // 各テスト前にお気に入りを全削除してクリーンな状態にする
  test.beforeEach(async ({ request }) => {
    for (const video of ALL_VIDEOS) {
      // DELETE は 404 でも問題ないので全動画に対して実行
      await request.delete(`http://localhost:18080/api/v1/favorites/${video.id}`).catch(() => {});
    }
  });

  test('FA-1: お気に入り未登録の初期状態', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const favButton = page.locator(SELECTORS.favoriteAdd).first();
    await expect(favButton).toBeVisible();
  });

  test('FA-2: お気に入りに追加（一覧ページ）', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const favButton = page.locator(SELECTORS.favoriteAdd).first();
    await favButton.click();
    await expect(page.locator(SELECTORS.favoriteRemove).first()).toBeVisible();
  });

  test('FA-3: お気に入りから削除（一覧ページ）', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);

    // まず追加
    await page.locator(SELECTORS.favoriteAdd).first().click();
    await expect(page.locator(SELECTORS.favoriteRemove).first()).toBeVisible();

    // 削除
    await page.locator(SELECTORS.favoriteRemove).first().click();
    await expect(page.locator(SELECTORS.favoriteAdd).first()).toBeVisible();
  });

  test('FA-4: お気に入りに追加（詳細ページ）', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');
    await page.locator(SELECTORS.favoriteAdd).click();
    await expect(page.locator(SELECTORS.favoriteRemove)).toBeVisible();
  });

  test('FA-5: お気に入り状態の永続化', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');

    // お気に入り追加のAPIレスポンスを待つ
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/favorites') && res.request().method() === 'POST'),
      page.locator(SELECTORS.favoriteAdd).click(),
    ]);
    expect(response.ok()).toBeTruthy();
    await expect(page.locator(SELECTORS.favoriteRemove)).toBeVisible();

    // ページリロード
    await page.reload();
    await page.waitForSelector('h1');
    await expect(page.locator(SELECTORS.favoriteRemove)).toBeVisible();
  });

  test('FA-6: お気に入りボタンのクリックでページ遷移しない', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.locator(SELECTORS.favoriteAdd).first().click();
    // 一覧ページのまま
    await expect(page).toHaveURL('/');
  });

  test('FA-7: 詳細ページでのお気に入り状態が一覧に反映される', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');

    // お気に入り追加のAPIレスポンスを待つ
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/favorites') && res.request().method() === 'POST'),
      page.locator(SELECTORS.favoriteAdd).click(),
    ]);
    expect(response.ok()).toBeTruthy();
    await expect(page.locator(SELECTORS.favoriteRemove)).toBeVisible();

    // 一覧ページに戻る
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator(SELECTORS.favoriteRemove).first()).toBeVisible();
  });
});
