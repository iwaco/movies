import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { clickTagButton, clickActorButton, openTagAccordion } from '../helpers/tag-cloud';

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
    await clickTagButton(page, 'タグ1');
    await expect(page).toHaveURL(/tag=/);
  });

  test('U-3: 出演者フィルタが URL に反映される', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await clickActorButton(page, '出演者A');
    await expect(page).toHaveURL(/actor=/);
  });

  test('U-4: URL パラメータからの状態復元', async ({ page }) => {
    await page.goto('/?q=テスト&tag=タグ1');
    await page.waitForSelector(SELECTORS.searchInput);
    await expect(page.locator(SELECTORS.searchInput)).toHaveValue('テスト');
    // アコーディオンを開いてタグ1ボタンが選択状態であること確認
    await openTagAccordion(page);
    const section = page.locator(SELECTORS.tagCloudHeader).locator('..');
    const tag1Button = section.getByRole('button', { name: 'タグ1' });
    await expect(tag1Button).toHaveClass(/bg-rose-500/);
  });

  test('U-5: 複数パラメータの同時 URL 反映', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
    await page.fill(SELECTORS.searchInput, 'テスト');
    await page.waitForTimeout(500);
    await clickTagButton(page, 'タグ1');
    await clickActorButton(page, '出演者A');

    const url = new URL(page.url());
    expect(url.searchParams.has('q')).toBeTruthy();
    expect(url.searchParams.has('tag')).toBeTruthy();
    expect(url.searchParams.has('actor')).toBeTruthy();
  });
});
