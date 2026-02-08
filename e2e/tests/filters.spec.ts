import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { VIDEO_1, VIDEO_2, VIDEO_3, TOTAL_VIDEOS_WITH_FORMAT } from '../helpers/test-data';
import { clickTagButton, clickActorButton, clickTagClear, clickActorClear, openTagAccordion, openActorAccordion } from '../helpers/tag-cloud';

/** カード数をカウントするセレクタ（各カードに img が1つ） */
const cardImg = '.grid a[href^="/videos/"] img';

test.describe('F: フィルタリング（タグ・出演者）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(SELECTORS.searchInput);
  });

  test('F-1: タグフィルタの初期状態（未選択・アコーディオン閉）', async ({ page }) => {
    // アコーディオンヘッダーが表示されていること
    const header = page.locator(SELECTORS.tagCloudHeader);
    await expect(header).toBeVisible();
    // デフォルトでアコーディオンが閉じていること
    const section = header.locator('..');
    const button = section.getByRole('button', { name: 'タグ1', exact: true });
    await expect(button).not.toBeVisible();
    // 選択数バッジが表示されていないこと
    await expect(section.locator('[data-testid="selection-count"]')).not.toBeVisible();
  });

  test('F-2: タグで絞り込み', async ({ page }) => {
    await clickTagButton(page, 'タグ1');
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).not.toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).not.toBeVisible();
  });

  test('F-3: タグフィルタをリセット（クリアボタン）', async ({ page }) => {
    await clickTagButton(page, 'タグ1');
    await expect(page.locator(cardImg)).toHaveCount(1);

    await clickTagClear(page);
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS_WITH_FORMAT);
  });

  test('F-4: タグクラウドのボタン一覧', async ({ page }) => {
    await openTagAccordion(page);
    const section = page.locator(SELECTORS.tagCloudHeader).locator('..');
    await expect(section.getByRole('button', { name: 'タグ1' })).toBeVisible();
    await expect(section.getByRole('button', { name: 'タグ2' })).toBeVisible();
    await expect(section.getByRole('button', { name: 'タグ3' })).toBeVisible();
  });

  test('F-5: 出演者フィルタの初期状態（未選択・アコーディオン閉）', async ({ page }) => {
    const header = page.locator(SELECTORS.actorCloudHeader);
    await expect(header).toBeVisible();
    const section = header.locator('..');
    const button = section.getByRole('button', { name: '出演者A', exact: true });
    await expect(button).not.toBeVisible();
    await expect(section.locator('[data-testid="selection-count"]')).not.toBeVisible();
  });

  test('F-6: 出演者で絞り込み', async ({ page }) => {
    await clickActorButton(page, '出演者C');
    await expect(page.locator(`a[href="/videos/${VIDEO_2.id}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).not.toBeVisible();
  });

  test('F-7: 出演者フィルタをリセット（クリアボタン）', async ({ page }) => {
    await clickActorButton(page, '出演者C');
    await expect(page.locator(cardImg)).toHaveCount(1);

    await clickActorClear(page);
    await expect(page.locator(cardImg)).toHaveCount(TOTAL_VIDEOS_WITH_FORMAT);
  });

  test('F-8: 出演者クラウドのボタン一覧', async ({ page }) => {
    await openActorAccordion(page);
    const section = page.locator(SELECTORS.actorCloudHeader).locator('..');
    await expect(section.getByRole('button', { name: '出演者A' })).toBeVisible();
    await expect(section.getByRole('button', { name: '出演者B' })).toBeVisible();
    await expect(section.getByRole('button', { name: '出演者C' })).toBeVisible();
  });

  test('F-9: フィルタ変更時にページが1にリセットされる', async ({ page }) => {
    await page.route(/\/api\/v1\/videos(\?|$)/, async (route) => {
      const url = new URL(route.request().url());
      const currentPage = Number(url.searchParams.get('page') || '1');
      const tags = url.searchParams.getAll('tag');

      const fetchUrl = new URL(url.toString());
      fetchUrl.searchParams.set('page', '1');
      const response = await route.fetch({ url: fetchUrl.toString() });
      const json = await response.json();

      const items = json.data || [];
      if (tags.length > 0) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
      } else {
        const perPage = 1;
        const total = items.length;
        const totalPages = Math.max(1, total);
        const start = (currentPage - 1) * perPage;
        const paged = items.slice(start, start + perPage);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...json, data: paged, page: currentPage, per_page: perPage, total, total_pages: totalPages,
          }),
        });
      }
    });

    await page.goto('/?page=2');
    await page.waitForSelector(SELECTORS.searchInput);
    await clickTagButton(page, 'タグ1');
    const url = new URL(page.url());
    const pageParam = url.searchParams.get('page');
    expect(pageParam === null || pageParam === '1').toBeTruthy();
  });

  test('F-10: タグが0件の動画はタグフィルタで除外される', async ({ page }) => {
    await clickTagButton(page, 'タグ1');
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).not.toBeVisible();
  });

  test('F-11: 出演者が0人の動画は出演者フィルタで除外される', async ({ page }) => {
    await clickActorButton(page, '出演者A');
    await expect(page.locator(`a[href="/videos/${VIDEO_3.id}"]`).first()).not.toBeVisible();
  });

  test('F-12: VideoCard のタグクリックでフィルタに追加', async ({ page }) => {
    // 一覧ページの VideoCard 上のタグリンクをクリック
    const tagLink = page.locator('.grid').getByRole('link', { name: 'タグ1', exact: true });
    await tagLink.click();
    // URL にタグパラメータが追加される
    await expect(page).toHaveURL(/tag=/);
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
  });

  test('F-13: VideoCard の出演者クリックでフィルタに追加', async ({ page }) => {
    const actorLink = page.locator('.grid').getByRole('link', { name: '出演者A', exact: true });
    await actorLink.click();
    await expect(page).toHaveURL(/actor=/);
    await expect(page.locator(`a[href="/videos/${VIDEO_1.id}"]`).first()).toBeVisible();
  });

  test('F-14: VideoCard のタグクリックで既存フィルタに条件追加', async ({ page }) => {
    // まずタグクラウドで「タグ1」を選択
    await clickTagButton(page, 'タグ1');
    await expect(page).toHaveURL(/tag=/);
    // フィルタ結果の VideoCard で「タグ2」リンクをクリック
    const tag2Link = page.locator('.grid').getByRole('link', { name: 'タグ2', exact: true });
    await tag2Link.click();
    // URL に両方のタグパラメータが含まれる
    const url = new URL(page.url());
    const tags = url.searchParams.getAll('tag');
    expect(tags).toContain('タグ1');
    expect(tags).toContain('タグ2');
  });
});
