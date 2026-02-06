# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

| コマンド | 説明 |
|---------|------|
| `make dev` | バックエンド開発サーバー起動 |
| `cd frontend && npm install && npm run dev` | フロントエンド開発サーバー起動（別ターミナル） |
| `make build` | フロントエンドビルド + バックエンドバイナリ生成 (`bin/server`) |
| `make build-converter` | コンバーター CLI ビルド (`bin/converter`) |
| `make test` | 全テスト実行（バックエンド + フロントエンド） |
| `make test-backend` | Go テストのみ (`go test ./...`) |
| `make test-frontend` | フロントエンドテストのみ (`cd frontend && npm test -- --run`) |
| `go test ./internal/repository/...` | 特定パッケージのテスト実行 |
| `cd frontend && npx vitest run src/components/VideoCard.test.tsx` | 特定のフロントエンドテスト実行 |
| `cd frontend && npm run lint` | フロントエンド ESLint 実行 |

## Architecture

Go バックエンド + React フロントエンドの動画管理 Web アプリケーション。

### Backend (Go)

レイヤードアーキテクチャ: Handler → Repository → Database (SQLite)

- `cmd/server/` - HTTP サーバーエントリーポイント
- `cmd/converter/` - JS→JSON 変換 CLI ツール
- `internal/handler/` - HTTP ハンドラー（VideoHandler, FavoriteHandler, ImportHandler, MediaHandler）
- `internal/repository/` - データアクセス層（VideoRepository, FavoriteRepository）
- `internal/database/` - SQLite 初期化・マイグレーション
- `internal/model/` - ドメインモデル（Video, Actor, Tag, Favorite, VideoFormat）
- `internal/config/` - 環境変数ベースの設定管理
- `internal/router/` - chi ルーター設定 + SPA フォールバック
- `internal/importer/` - JSON データの DB インポート（upsert、トランザクション）
- `internal/converter/` - JavaScript データ形式を JSON に変換

ルーターは `go-chi/chi` を使用。SQLite は FTS5 全文検索を搭載。

### Frontend (React + TypeScript)

- `frontend/src/pages/` - VideoListPage, VideoDetailPage
- `frontend/src/components/` - VideoCard, SearchBar, FilterPanel, Pagination, VideoPlayer, ImageGallery, FavoriteButton
- `frontend/src/api/client.ts` - バックエンド API クライアント
- `frontend/src/types/video.ts` - TypeScript 型定義

TanStack React Query でデータフェッチ・キャッシュ管理。Tailwind CSS v4 でスタイリング。Vite でビルド。開発時は `/api` と `/media` を localhost:8080 にプロキシ。

### Testing

- バックエンド: Go 標準 `testing` パッケージ、インメモリ SQLite でテスト
- フロントエンド: Vitest + React Testing Library + MSW（Mock Service Worker）
- モックハンドラー: `frontend/src/test/mocks/handlers.ts`

## Environment Variables

| 変数名 | 説明 | デフォルト |
|--------|------|----------|
| `MOVIES_DB_PATH` | SQLite DB ファイルパス | `movies.db` |
| `MOVIES_MEDIA_ROOT` | メディアファイルルートディレクトリ | `./media` |
| `MOVIES_PORT` | サーバーリッスンポート | `8080` |

## Pull Request (PR) Strategy

- PR を作成する前に、必ずテスト（`make test`）を実行し、全テストが通過することを確認すること。
