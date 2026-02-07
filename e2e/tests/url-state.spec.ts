import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';

test.describe('U: URL 状態管理', () => {
  test('U-1: 検索クエリが URL に反映される', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.fill(SELECTORS.searchInput, 'テスト');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/q=%E3%83%86%E3%82%B9%E3%83%88|q=テスト/);
  });

  test('U-2: タグフィルタが URL に反映される', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await expect(page).toHaveURL(/tag=/);
  });

  test('U-3: 出演者フィルタが URL に反映される', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.selectOption(SELECTORS.actorFilter, '出演者A');
    await expect(page).toHaveURL(/actor=/);
  });

  test('U-4: URL パラメータからの状態復元', async ({ page }) => {
    await page.goto('/?q=テスト&tag=タグ1');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator(SELECTORS.searchInput)).toHaveValue('テスト');
    await expect(page.locator(SELECTORS.tagFilter)).toHaveValue('タグ1');
  });

  test('U-5: 複数パラメータの同時 URL 反映', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.fill(SELECTORS.searchInput, 'テスト');
    await page.waitForTimeout(500);
    await page.selectOption(SELECTORS.tagFilter, 'タグ1');
    await page.selectOption(SELECTORS.actorFilter, '出演者A');

    const url = new URL(page.url());
    expect(url.searchParams.has('q')).toBeTruthy();
    expect(url.searchParams.has('tag')).toBeTruthy();
    expect(url.searchParams.has('actor')).toBeTruthy();
  });
});
