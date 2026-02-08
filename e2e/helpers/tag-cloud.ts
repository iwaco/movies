import type { Page } from '@playwright/test';

/** アコーディオンが閉じている場合に開いてからボタンをクリックする */
async function clickButtonInAccordion(page: Page, sectionLabel: string, buttonName: string) {
  const section = page.locator(`[data-testid="accordion-header"]:has-text("${sectionLabel}")`).locator('..');
  const button = section.getByRole('button', { name: buttonName, exact: true });
  if (!(await button.isVisible())) {
    await section.locator('[data-testid="accordion-header"]').click();
    await button.waitFor({ state: 'visible' });
  }
  await button.click();
}

/** アコーディオンを開く（すでに開いている場合は何もしない） */
async function ensureAccordionOpen(page: Page, sectionLabel: string) {
  const section = page.locator(`[data-testid="accordion-header"]:has-text("${sectionLabel}")`).locator('..');
  const firstButton = section.locator('[data-testid="accordion-content"] button').first();
  if (!(await firstButton.isVisible())) {
    await section.locator('[data-testid="accordion-header"]').click();
    await firstButton.waitFor({ state: 'visible' });
  }
}

/** タグクラウド内のタグボタンをクリック */
export async function clickTagButton(page: Page, name: string) {
  await clickButtonInAccordion(page, 'タグ', name);
}

/** タグクラウド内の出演者ボタンをクリック */
export async function clickActorButton(page: Page, name: string) {
  await clickButtonInAccordion(page, '出演者', name);
}

/** タグクラウドのクリアボタンをクリック */
export async function clickTagClear(page: Page) {
  await clickButtonInAccordion(page, 'タグ', 'クリア');
}

/** 出演者クラウドのクリアボタンをクリック */
export async function clickActorClear(page: Page) {
  await clickButtonInAccordion(page, '出演者', 'クリア');
}

/** タグアコーディオンを開く */
export async function openTagAccordion(page: Page) {
  await ensureAccordionOpen(page, 'タグ');
}

/** 出演者アコーディオンを開く */
export async function openActorAccordion(page: Page) {
  await ensureAccordionOpen(page, '出演者');
}
