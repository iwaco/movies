/** UI セレクタ定数 */

export const SELECTORS = {
  // 検索
  searchInput: 'input[placeholder="検索..."]',

  // フィルタ（タグクラウド）
  tagCloudHeader: '[data-testid="accordion-header"]:has-text("タグ")',
  actorCloudHeader: '[data-testid="accordion-header"]:has-text("出演者")',
  cloudToggle: 'button[aria-label="動画のみ表示中"], button[aria-label="全て表示中"]',

  // 星フィルタ
  starFilter: '[role="group"][aria-label="星フィルタ"]',

  // 星評価
  starRating: '[role="group"][aria-label="評価"]',

  // ページネーション
  prevButton: 'button:has-text("前へ")',
  nextButton: 'button:has-text("次へ")',

  // テーマ
  darkModeToggle: 'button[aria-label="ダークモードに切替"]',
  lightModeToggle: 'button[aria-label="ライトモードに切替"]',

  // 動画プレイヤー
  formatSelect: '#format-select',
  videoElement: 'video',

  // 外部リンク
  externalLink: 'a:has-text("外部リンク")',

  // 詳細ページ見出し
  actorsHeading: 'h2:has-text("出演者")',
  tagsHeading: 'h2:has-text("タグ")',
  imagesHeading: 'h2:has-text("画像")',
} as const;
