import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1, VIDEO_2 } from '../helpers/test-data';

/** カード数をカウントするセレクタ（各カードに img が1つ） */
const cardImg = '.grid a[href^="/videos/"] img';

test.describe('C: 複合フィルタ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
  });

  test('C-1: 検索 + タグフィルタ', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, 'テスト');
    await page.waitForTimeout(500);
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).not.toBeVisible();
  });

  test('C-2: 検索 + 出演者フィルタ', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, 'テスト');
    await page.waitForTimeout(500);
    await page.selectOption(SELECTORS.actorFilter, '出演者C');
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).not.toBeVisible();
  });

  test('C-3: タグ + 出演者フィルタ', async ({ page }) => {
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await page.selectOption(SELECTORS.actorFilter, '出演者A');
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
    await expect(page.locator(cardImg)).toHaveCount(1);
  });

  test('C-4: 検索 + タグ + 出演者フィルタ', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, 'テスト');
    await page.waitForTimeout(500);
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await page.selectOption(SELECTORS.actorFilter, '出演者A');
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
    await expect(page.locator(cardImg)).toHaveCount(1);
  });

  test('C-5: 一致しない複合フィルタ', async ({ page }) => {
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await page.selectOption(SELECTORS.actorFilter, '出演者C');
    await expect(page.locator(cardImg)).toHaveCount(0);
  });

  test('C-6: 複合フィルタの一部を解除', async ({ page }) => {
    await page.fill(SELECTORS.searchInput, 'テスト');
    await page.waitForTimeout(500);
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await page.selectOption(SELECTORS.actorFilter, '出演者A');
    await expect(page.locator(cardImg)).toHaveCount(1);

    // タグフィルタを解除
    await page.selectOption(SELECTORS.tagFilter, '');
    // 検索「テスト」+ 出演者「出演者A」の結果
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
  });
});
