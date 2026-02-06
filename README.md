# Movies

動画を管理・閲覧するためのWebアプリケーションです。Go バックエンドと React フロントエンドで構成されています。

## 必要要件

- Go 1.25+
- Node.js (npm)

## 起動方法

### 開発モード

バックエンド:

```bash
make dev
```

フロントエンド（別ターミナル）:

```bash
cd frontend && npm install && npm run dev
```

### プロダクションビルド

```bash
make build
./bin/server
```

フロントエンドのビルド成果物が `frontend/dist/` に出力され、バックエンドがSPAとして配信します。

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|---|---|---|
| `MOVIES_DB_PATH` | SQLite データベースファイルのパス | `movies.db` |
| `MOVIES_MEDIA_ROOT` | メディアファイルのルートディレクトリ | `./media` |
| `MOVIES_PORT` | サーバーのリッスンポート | `8080` |

## データインポート

JSON ファイルを POST リクエストで送信してデータをインポートできます。

```bash
curl -X POST http://localhost:8080/api/v1/import \
  -H "Content-Type: application/json" \
  -d @data.json
```

## テスト実行

```bash
make test
```

バックエンドとフロントエンドの全テストを実行します。個別に実行する場合:

```bash
make test-backend    # Go テストのみ
make test-frontend   # フロントエンドテストのみ
```

## API エンドポイント一覧

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/v1/videos` | 動画一覧の取得 |
| `GET` | `/api/v1/videos/{id}` | 動画詳細の取得 |
| `GET` | `/api/v1/videos/{id}/pictures` | 動画のサムネイル一覧の取得 |
| `GET` | `/api/v1/tags` | タグ一覧の取得 |
| `GET` | `/api/v1/actors` | 出演者一覧の取得 |
| `GET` | `/api/v1/favorites` | お気に入り一覧の取得 |
| `POST` | `/api/v1/favorites` | お気に入りの追加 |
| `DELETE` | `/api/v1/favorites/{videoID}` | お気に入りの削除 |
| `POST` | `/api/v1/import` | JSON データのインポート |
| `GET` | `/media/*` | メディアファイルの配信 |
