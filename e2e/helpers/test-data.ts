/** テストデータ定数 */

export const VIDEO_1 = {
  id: 'video-1',
  title: 'テスト動画1 サンプル',
  url: 'https://example.com/video-1',
  date: '2024-01-15',
  actors: ['出演者A', '出演者B'],
  tags: ['タグ1', 'タグ2'],
  formats: ['1080p', '720p'],
  pictureCount: 3,
} as const;

export const VIDEO_2 = {
  id: 'video-2',
  title: 'テスト動画2',
  url: 'https://example.com/video-2',
  date: '2024-02-20',
  actors: ['出演者C'],
  tags: ['タグ3'],
  formats: ['720p'],
  pictureCount: 1,
} as const;

export const VIDEO_3 = {
  id: 'video-3',
  title: 'テスト動画3 空データ',
  url: '',
  date: '2024-03-10',
  actors: [] as readonly string[],
  tags: [] as readonly string[],
  formats: [] as readonly string[],
  pictureCount: 0,
} as const;

export const ALL_VIDEOS = [VIDEO_1, VIDEO_2, VIDEO_3] as const;
export const TOTAL_VIDEOS = ALL_VIDEOS.length;

/** フォーマット（動画ファイル）を持つ動画のみ（デフォルト表示） */
export const VIDEOS_WITH_FORMAT = [VIDEO_1, VIDEO_2] as const;
export const TOTAL_VIDEOS_WITH_FORMAT = VIDEOS_WITH_FORMAT.length;

export const ALL_TAGS = ['タグ1', 'タグ2', 'タグ3'] as const;
export const ALL_ACTORS = ['出演者A', '出演者B', '出演者C'] as const;
