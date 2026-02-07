import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';

test.describe('T: テーマ切替', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    // テーマをリセット（localStorage クリア）
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
  });

  test('T-1: テーマ切替ボタンの表示', async ({ page }) => {
    await expect(page.locator(SELECTORS.darkModeToggle)).toBeVisible();
  });

  test('T-2: ダークモードに切替', async ({ page }) => {
    await page.locator(SELECTORS.darkModeToggle).click();
    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(hasDarkClass).toBeTruthy();
  });

  test('T-3: ライトモードに切替', async ({ page }) => {
    // まずダークモードにする
    await page.locator(SELECTORS.darkModeToggle).click();
    await expect(page.locator(SELECTORS.lightModeToggle)).toBeVisible();

    // ライトモードに切替
    await page.locator(SELECTORS.lightModeToggle).click();
    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(hasDarkClass).toBeFalsy();
  });

  test('T-4: テーマの永続化', async ({ page }) => {
    await page.locator(SELECTORS.darkModeToggle).click();

    // ページリロード
    await page.reload();
    await page.waitForSelector(SELECTORS.searchInput);

    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(hasDarkClass).toBeTruthy();
  });

  test('T-5: ダークモード時のアイコン', async ({ page }) => {
    await page.locator(SELECTORS.darkModeToggle).click();
    await expect(page.locator(SELECTORS.lightModeToggle)).toBeVisible();
  });

  test('T-6: ライトモード時のアイコン', async ({ page }) => {
    await expect(page.locator(SELECTORS.darkModeToggle)).toBeVisible();
  });

  test('T-7: テーマ切替がページ遷移後も維持される', async ({ page }) => {
    await page.locator(SELECTORS.darkModeToggle).click();

    // 詳細ページに遷移
    await page.locator('a[href^="/videos/"]').first().click();
    await page.waitForURL(/\/videos\//);

    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(hasDarkClass).toBeTruthy();
  });
});
