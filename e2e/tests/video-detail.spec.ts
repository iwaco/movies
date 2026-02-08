import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1, VIDEO_2, VIDEO_3 } from '../helpers/test-data';

test.describe('D: 詳細ページ表示', () => {
  test('D-1: 全フィールドが揃った動画の詳細表示', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');
    // タイトル
    await expect(page.locator('h1')).toContainText(VIDEO_1.title);
    // 日付
    await expect(page.getByText(VIDEO_1.date)).toBeVisible();
    // 外部リンク
    await expect(page.locator(SELECTORS.externalLink)).toBeVisible();
    // 出演者バッジ
    for (const actor of VIDEO_1.actors) {
      await expect(page.getByText(actor)).toBeVisible();
    }
    // タグバッジ
    for (const tag of VIDEO_1.tags) {
      await expect(page.getByText(tag)).toBeVisible();
    }
    // 画像セクション
    await expect(page.locator(SELECTORS.imagesHeading)).toBeVisible();
  });

  test('D-2: 出演者が複数の場合', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');
    await expect(page.locator(SELECTORS.actorsHeading)).toBeVisible();
    for (const actor of VIDEO_1.actors) {
      await expect(page.getByText(actor)).toBeVisible();
    }
  });

  test('D-3: 出演者が1人の場合', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_2.id}`);
    await page.waitForSelector('h1');
    await expect(page.getByText(VIDEO_2.actors[0])).toBeVisible();
  });

  test('D-4: 出演者が0人の場合', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_3.id}`);
    await page.waitForSelector('h1');
    // 出演者セクション配下にバッジが表示されない
    // video-3 は actors が空なので、出演者名のスパンが無い
    const actorsSection = page.locator(SELECTORS.actorsHeading).locator('..').locator('.flex.flex-wrap span');
    await expect(actorsSection).toHaveCount(0);
  });

  test('D-5: 外部リンクの動作', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_1.id}`);
    await page.waitForSelector('h1');
    const link = page.locator(SELECTORS.externalLink);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);
    await expect(link).toHaveAttribute('href', VIDEO_1.url);
  });

  test('D-6: 外部リンクが空の場合', async ({ page }) => {
    await page.goto(`/videos/${VIDEO_3.id}`);
    await page.waitForSelector('h1');
    const link = page.locator(SELECTORS.externalLink);
    const href = await link.getAttribute('href');
    expect(href === '' || href === null).toBeTruthy();
  });
});
