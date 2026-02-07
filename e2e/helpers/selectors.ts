/** UI セレクタ定数 */

export const SELECTORS = {
  // 検索
  searchInput: 'input[placeholder="検索..."]',

  // フィルタ
  tagFilter: '#tag-filter',
  actorFilter: '#actor-filter',

  // ページネーション
  prevButton: 'button:has-text("前へ")',
  nextButton: 'button:has-text("次へ")',

  // お気に入り
  favoriteAdd: 'button[aria-label="お気に入りに追加"]',
  favoriteRemove: 'button[aria-label="お気に入りから削除"]',

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
