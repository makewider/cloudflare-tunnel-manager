# Cloudflare Tunnel Manager

Cloudflare Tunnel、DNS、Access を一元管理するための Web ダッシュボードアプリケーションです。

## 機能

### Dashboard
- リソースの統計情報表示
- クイックアクション
- 最近のトンネル・アプリケーション一覧

### Tunnels 管理
- トンネル一覧の表示
- 新規トンネルの作成
- トンネル設定の編集（Ingress ルール設定）
- トンネルトークンの取得
- トンネルの削除

### DNS 管理
- Zone の選択
- DNS レコード一覧の表示
- DNS レコードの作成・編集・削除
- 対応レコードタイプ: A, AAAA, CNAME, TXT, MX など

### Access 管理
- Access アプリケーションの管理（Self-Hosted Apps）
- Access ポリシーの管理
- ルールビルダーによる柔軟なアクセス制御設定

## 技術スタック

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4, shadcn/ui (Radix UI)
- **State Management**: SWR
- **Form**: React Hook Form, Zod
- **API**: Cloudflare SDK

## 必要条件

- Node.js 22+
- Cloudflare アカウント
- Cloudflare API Token（以下の権限が必要）:
  - Zone: Read
  - DNS: Edit
  - Cloudflare Tunnel: Edit
  - Access: Apps and Policies: Edit

## 環境変数

```bash
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プロダクションサーバーの起動
npm run start

# Lint
npm run lint
```

http://localhost:3000 でアプリケーションにアクセスできます。

## Docker

```bash
# イメージのビルド
docker build -t cloudflare-tunnel-manager .

# コンテナの起動
docker run -p 3000:3000 \
  -e CLOUDFLARE_API_TOKEN=your_api_token \
  -e CLOUDFLARE_ACCOUNT_ID=your_account_id \
  cloudflare-tunnel-manager
```

## ディレクトリ構成

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── access/        # Access API
│   │   ├── dns/           # DNS API
│   │   ├── tunnels/       # Tunnels API
│   │   └── zones/         # Zones API
│   ├── access/            # Access ページ
│   ├── dns/               # DNS ページ
│   └── tunnels/           # Tunnels ページ
├── components/            # React コンポーネント
│   ├── access/            # Access 関連コンポーネント
│   ├── common/            # 共通コンポーネント
│   ├── dashboard/         # ダッシュボードコンポーネント
│   ├── dns/               # DNS 関連コンポーネント
│   ├── layout/            # レイアウトコンポーネント
│   ├── tunnels/           # Tunnels 関連コンポーネント
│   └── ui/                # shadcn/ui コンポーネント
└── lib/                   # ライブラリ
    ├── cloudflare/        # Cloudflare API クライアント
    └── validations/       # Zod バリデーションスキーマ
```
