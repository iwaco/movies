import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1, ALL_VIDEOS } from '../helpers/test-data';

test.describe('RT: 星評価', () => {
  // 各テスト前に全動画の評価を削除してクリーンな状態にする
  test.beforeEach(async ({ request }) => {
    for (const video of ALL_VIDEOS) {
      await request.delete(`http://localhost:18080/api/v1/ratings/${video.id}`).catch(() => {});
    }
  });

  test('RT-1: 評価未登録の初期状態（5つの空の星ボタンが表示される）', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const starGroup = page.locator(SELECTORS.starRating).first();
    await expect(starGroup).toBeVisible();
    const stars = starGroup.locator('button');
    await expect(stars).toHaveCount(5);
    // All stars should be unpressed
    for (let i = 0; i < 5; i++) {
      await expect(stars.nth(i)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('RT-2: 星をクリックして評価を設定（一覧ページ）', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const starGroup = page.locator(SELECTORS.starRating).first();
    const stars = starGroup.locator('button');
    await stars.nth(2).click(); // Click star 3
    // First 3 stars should be pressed
    await expect(stars.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(stars.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(stars.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(stars.nth(3)).toHaveAttribute('aria-pressed', 'false');
    await expect(stars.nth(4)).toHaveAttribute('aria-pressed', 'false');
  });

  test('RT-3: 同じ星をクリックして評価を解除（一覧ページ）', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const starGroup = page.locator(SELECTORS.starRating).first();
    const stars = starGroup.locator('button');

    // まず評価を設定
    await stars.nth(2).click();
    await expect(stars.nth(2)).toHaveAttribute('aria-pressed', 'true');

    // 同じ星をクリックして解除
    await stars.nth(2).click();
    for (let i = 0; i < 5; i++) {
      await expect(stars.nth(i)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('RT-4: 星をクリックして評価を設定（詳細ページ）', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');
    const starGroup = page.locator(SELECTORS.starRating);
    const stars = starGroup.locator('button');
    await stars.nth(4).click(); // Click star 5
    await expect(stars.nth(4)).toHaveAttribute('aria-pressed', 'true');
  });

  test('RT-5: 評価状態の永続化（リロード後も評価が維持される）', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');
    const starGroup = page.locator(SELECTORS.starRating);
    const stars = starGroup.locator('button');

    // 評価設定のAPIレスポンスを待つ
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/ratings/') && res.request().method() === 'PUT'),
      stars.nth(3).click(),
    ]);
    expect(response.ok()).toBeTruthy();
    await expect(stars.nth(3)).toHaveAttribute('aria-pressed', 'true');

    // ページリロード
    await page.reload();
    await page.waitForSelector('h1');
    const reloadedStars = page.locator(SELECTORS.starRating).locator('button');
    await expect(reloadedStars.nth(3)).toHaveAttribute('aria-pressed', 'true');
  });

  test('RT-6: 星ボタンのクリックでページ遷移しない', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    const starGroup = page.locator(SELECTORS.starRating).first();
    const stars = starGroup.locator('button');
    await stars.nth(0).click();
    // 一覧ページのまま
    await expect(page).toHaveURL('/');
  });

  test('RT-7: 詳細ページでの評価が一覧に反映される', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');
    const starGroup = page.locator(SELECTORS.starRating);
    const stars = starGroup.locator('button');

    // 評価設定のAPIレスポンスを待つ
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/ratings/') && res.request().method() === 'PUT'),
      stars.nth(2).click(),
    ]);
    expect(response.ok()).toBeTruthy();
    await expect(stars.nth(2)).toHaveAttribute('aria-pressed', 'true');

    // 一覧ページに戻る
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    // video-1 の StarRating を見つける
    const videoCard = page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first().locator('..');
    const listStars = videoCard.locator(SELECTORS.starRating).locator('button');
    await expect(listStars.nth(2)).toHaveAttribute('aria-pressed', 'true');
  });
});
