# Cloudflare Tunnel Manager - 仕様書

## 1. プロジェクト概要

Cloudflare DNS、Cloudflare Tunnel、Cloudflare Accessの3つのサービスをAPI経由で一元管理するWebサービス。

### 1.1 技術スタック
| 項目 | 技術 |
|------|------|
| Framework | Next.js 15.5.6 (App Router) |
| Language | TypeScript 5 |
| UI Framework | React 19 |
| CSS | Tailwind CSS 4 |
| Component Library | Shadcn/ui (New York style) |
| Icons | Lucide React |
| Validation | Zod |
| Form | React Hook Form |
| **Data Fetching** | **SWR** |
| **Cloudflare SDK** | **cloudflare (v5.x - 公式TypeScript SDK)** |

#### Cloudflare SDK採用理由
- **型安全性**: 全APIに対する完全なTypeScript型定義（自動生成で常に最新）
- **保守性**: API変更への追従が自動、手動でのAPI仕様追跡が不要
- **信頼性**: 自動リトライ（429/5xxエラー）、認証管理が組み込み済み
- **一貫性**: DNS/Tunnel/Access全てで同じパターンでAPI呼び出し可能
- **セキュリティ**: 特にAccess APIの複雑な構造を安全に扱える

### 1.2 認証方式
- **Cloudflare API認証**: 環境変数によるAPI Token管理
- **ユーザー認証**: なし（内部ツール、ネットワークレベルで保護される想定）
- **UIデザイン**: シンプル・機能重視

---

## 2. 機能要件

### 2.1 Cloudflare DNS管理

#### 機能一覧
| 機能 | 説明 |
|------|------|
| DNS一覧表示 | 登録済みDNSレコードの一覧表示 |
| DNS作成 | 新規DNSレコードの作成 |
| DNS更新 | 既存DNSレコードの編集 |
| DNS削除 | DNSレコードの削除 |

#### 表示項目
- レコードタイプ (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA)
- Name（ソース）
- Content（ディスティネーション）
- TTL
- Proxied状態
- 作成日時

#### Cloudflare API
```
Base URL: https://api.cloudflare.com/client/v4

GET    /zones/{zone_id}/dns_records          # 一覧取得
POST   /zones/{zone_id}/dns_records          # 作成
GET    /zones/{zone_id}/dns_records/{id}     # 詳細取得
PATCH  /zones/{zone_id}/dns_records/{id}     # 部分更新
PUT    /zones/{zone_id}/dns_records/{id}     # 完全更新
DELETE /zones/{zone_id}/dns_records/{id}     # 削除
```

---

### 2.2 Cloudflare Tunnel管理

#### 機能一覧
| 機能 | 説明 |
|------|------|
| Tunnel一覧表示 | 既存トンネルの一覧表示 |
| Tunnel作成 | 新規トンネルの作成（シークレット自動生成） |
| トークン取得 | cloudflared実行用トークンの取得（ワンクリックコピー機能付き） |
| Ingress設定 | トンネルのネットワーク設定（hostname → service マッピング） |
| Tunnel削除 | トンネルの削除 |

#### 表示項目
- トンネル名
- ステータス (active/inactive)
- 接続情報（コネクター数、データセンター）
- 作成日時

#### Tunnel作成の仕組み（重要）
トンネル作成時には**`tunnel_secret`を自分で生成**してCloudflare APIに送信する必要がある。

1. **サーバー側でシークレット生成**: 32バイトのランダムキーを生成し、Base64エンコード
2. **APIでトンネル作成**: `name`と`tunnel_secret`をPOST
3. **トークン取得**: 作成後、`/token`エンドポイントで実行用トークンを取得

```typescript
// シークレット生成例（Node.js）
import crypto from 'crypto';
const tunnelSecret = crypto.randomBytes(32).toString('base64');
```

#### トークン表示の要件
- トークンは`/token`エンドポイントから**いつでも取得可能**
- ワンクリックコピーボタン付き
- `cloudflared tunnel --token <TOKEN> run`で実行可能

#### Cloudflare API
```
GET    /accounts/{account_id}/cfd_tunnel                      # 一覧取得
POST   /accounts/{account_id}/cfd_tunnel                      # 作成（name, tunnel_secret必須）
GET    /accounts/{account_id}/cfd_tunnel/{tunnel_id}          # 詳細取得
DELETE /accounts/{account_id}/cfd_tunnel/{tunnel_id}          # 削除
GET    /accounts/{account_id}/cfd_tunnel/{tunnel_id}/token    # トークン取得
GET    /accounts/{account_id}/cfd_tunnel/{tunnel_id}/configurations    # 設定取得
PUT    /accounts/{account_id}/cfd_tunnel/{tunnel_id}/configurations    # 設定更新
```

#### Tunnel作成リクエスト例
```json
// POST /accounts/{account_id}/cfd_tunnel
{
  "name": "my-tunnel",
  "tunnel_secret": "BASE64_ENCODED_32_BYTE_RANDOM_KEY"
}
```

#### Ingress設定フォーマット

**Cloudflare APIへ送信するフォーマット:**
```json
{
  "config": {
    "ingress": [
      {
        "hostname": "app.example.com",
        "service": "http://localhost:8080"
      },
      {
        "hostname": "api.example.com",
        "service": "http://127.0.0.1:9000"
      },
      {
        "service": "http_status:404"
      }
    ]
  }
}
```

**UIフォーム入力形式（重要）:**

ユーザーが直接hostnameを入力するのではなく、**Zone選択 + subdomain入力**の形式を採用する。

| 入力項目 | 説明 | 例 |
|---------|------|-----|
| Zone選択 | ドロップダウンで許可Zoneから選択 | `example.com` |
| Subdomain | サブドメイン部分のみ入力 | `app` |
| Path | パスパターン（オプション） | `/api/*` |
| Service | 転送先サービスURL | `http://localhost:8080` |

**UIからAPIへの変換:**
```
Zone: example.com (ID: abc123)
Subdomain: app
Path: (空)
Service: http://localhost:8080

↓ 変換

hostname: "app.example.com"
service: "http://localhost:8080"
```

**この設計の利点:**
- Zone IDが確定するため、DNSレコード自動作成が正しく動作する
- 許可されたZone以外へのIngress設定を防止できる
- ユーザーは短いsubdomain部分のみ入力すればよく、UXが向上する

#### Tunnel表示のフィルタリング（重要）

Tunnel一覧では、**許可されたZone（`CLOUDFLARE_ZONES`）に属するhostnameのみを持つTunnel**を表示する。

| ケース | 動作 |
|--------|------|
| 全Ingressが許可Zone内 | 表示する |
| 一部でも許可外Zoneあり | **非表示** |
| Ingress設定なし | 表示する（新規設定可能） |

**実装箇所**: `lib/cloudflare/tunnels.ts` の一覧取得時にフィルタリング

```typescript
export async function listTunnels(): Promise<Tunnel[]> {
  const tunnels = await cloudflare.zeroTrust.tunnels.list({
    account_id: accountId,
  });

  // 各Tunnelの設定を取得し、許可Zoneのみのものをフィルタ
  const filteredTunnels = await Promise.all(
    tunnels.result.map(async (tunnel) => {
      const config = await getTunnelConfig(tunnel.id);
      if (!config?.ingress) return tunnel; // 設定なしは許可

      const hasDisallowedHostname = config.ingress.some(rule => {
        if (!rule.hostname) return false; // catch-all は無視
        return parseHostname(rule.hostname) === null;
      });

      return hasDisallowedHostname ? null : tunnel;
    })
  );

  return filteredTunnels.filter(Boolean) as Tunnel[];
}
```

#### Ingress設定取得時のhostname逆変換（重要）

既存のIngress設定を編集フォームに表示する際、APIから取得した`hostname`を`zoneId`と`subdomain`に分解する必要がある。

**Cloudflare APIレスポンス → UIフォーム表示への変換:**
```
hostname: "app.example.com"
↓ 逆変換（CLOUDFLARE_ZONESとマッチング）
Zone: example.com (ID: abc123から検索)
Subdomain: app
```

**実装箇所**: `lib/cloudflare/zones.ts`

```typescript
/**
 * hostnameを許可されたZoneとマッチングし、zoneIdとsubdomainに分解する
 * @returns 許可されたZoneに属していない場合はnull
 */
export function parseHostname(hostname: string): { zoneId: string; subdomain: string } | null {
  const zones = getAllowedZones();

  for (const zone of zones) {
    // 完全一致（ルートドメイン）
    if (hostname === zone.name) {
      return { zoneId: zone.id, subdomain: '' };
    }
    // サブドメイン付き
    if (hostname.endsWith(`.${zone.name}`)) {
      const subdomain = hostname.slice(0, -(zone.name.length + 1));
      return { zoneId: zone.id, subdomain };
    }
  }

  return null; // 許可されていないZone
}
```

#### Ingress設定とDNS連携（重要）
Cloudflare API経由でIngress設定（hostname → service マッピング）を更新すると、指定したhostnameに対応する**CNAMEレコードが自動的に作成**される。

| 項目 | 内容 |
|------|------|
| 自動作成レコード | `hostname` → `<tunnel_id>.cfargotunnel.com` (CNAME) |
| 対象Zone | hostnameのドメインに対応するZone（`CLOUDFLARE_ZONES`に含まれている必要あり） |
| Proxied | 自動的にプロキシ有効（オレンジ雲）で作成 |

**UI上の考慮事項:**
- Ingress設定画面で、DNSレコードが自動作成されることをユーザーに通知する
- DNS一覧画面では、Tunnel経由で自動作成されたレコードも表示される（通常のCNAMEレコードとして）

---

### 2.3 Cloudflare Access管理

#### 機能一覧
| 機能 | 説明 |
|------|------|
| Accessアプリ一覧 | 登録済みAccessアプリケーションの一覧表示 |
| Accessアプリ作成 | 新規アプリケーションの作成（self_hostedタイプ） |
| Accessアプリ更新 | アプリケーション設定の編集 |
| Accessアプリ削除 | アプリケーションの削除 |
| **再利用可能ポリシー一覧** | アカウントレベルの共有ポリシー一覧表示 |
| **再利用可能ポリシー作成** | 複数アプリで共有できるポリシーの作成 |
| **再利用可能ポリシー更新** | 共有ポリシーの編集（全連携アプリに反映） |
| **再利用可能ポリシー削除** | 共有ポリシーの削除 |
| **ポリシーをアプリに紐付け** | 再利用可能ポリシーをアプリケーションにアタッチ |

#### 再利用可能ポリシー（Reusable Policies）について
Cloudflare Accessでは、**アカウントレベルで定義した再利用可能ポリシー**を複数のアプリケーションで共有できる。

**メリット:**
- 一箇所で定義、複数アプリで使い回し
- ポリシー更新が全連携アプリに即時反映
- 管理の一元化・簡素化

**推奨アプローチ:**
- Cloudflareは再利用可能ポリシーの使用を推奨（アプリ固有ポリシーより優先）
- 例: 「社員のみ」「管理者のみ」「外部パートナー」などの共通ポリシーを定義

#### Accessアプリケーション設定項目
- name: アプリケーション名
- domain: 保護対象ドメイン（DNSホスト名と連携）
- type: self_hosted（主に使用）
- session_duration: セッション有効期間
- app_launcher_visible: App Launcherでの表示有無
- allowed_idps: 許可するIDプロバイダー
- **policies**: 紐付けるポリシーIDの配列（再利用可能ポリシーのID）

#### ポリシー設定項目
- name: ポリシー名
- precedence: 優先順位
- decision: allow / deny / bypass
- include: 許可条件（email_domain, group等）
- exclude: 除外条件
- require: 必須条件（device_posture, geo等）
- session_duration: セッション有効期間
- approval_required: 承認ワークフローの有効化（オプション）

#### Cloudflare API
```
# Applications
GET    /accounts/{account_id}/access/apps                    # 一覧取得
POST   /accounts/{account_id}/access/apps                    # 作成
GET    /accounts/{account_id}/access/apps/{app_id}           # 詳細取得
PUT    /accounts/{account_id}/access/apps/{app_id}           # 更新（policiesでポリシー紐付け）
DELETE /accounts/{account_id}/access/apps/{app_id}           # 削除

# Reusable Policies (Account Level) - 推奨
GET    /accounts/{account_id}/access/policies                # 一覧取得
POST   /accounts/{account_id}/access/policies                # 作成
GET    /accounts/{account_id}/access/policies/{policy_id}    # 詳細取得（app_count含む）
PUT    /accounts/{account_id}/access/policies/{policy_id}    # 更新
DELETE /accounts/{account_id}/access/policies/{policy_id}    # 削除

# Application-specific Policies (非推奨・レガシー)
GET    /accounts/{account_id}/access/apps/{app_id}/policies              # 一覧取得
POST   /accounts/{account_id}/access/apps/{app_id}/policies              # 作成
PUT    /accounts/{account_id}/access/apps/{app_id}/policies/{policy_id}  # 更新
DELETE /accounts/{account_id}/access/apps/{app_id}/policies/{policy_id}  # 削除
```

#### アプリケーションへのポリシー紐付け例
```json
// PUT /accounts/{account_id}/access/apps/{app_id}
{
  "name": "Internal Dashboard",
  "domain": "dash.example.com",
  "type": "self_hosted",
  "session_duration": "24h",
  "policies": [
    { "id": "reusable-policy-uuid-1" },
    { "id": "reusable-policy-uuid-2" }
  ]
}
```

---

## 3. システム設計

### 3.1 ディレクトリ構造

```
cloudflare-tunnel-manager/
├── app/
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # ダッシュボード
│   ├── globals.css                   # グローバルCSS
│   ├── error.tsx                     # グローバルエラーバウンダリ
│   ├── not-found.tsx                 # 404ページ
│   ├── loading.tsx                   # グローバルローディング
│   │
│   ├── api/                          # API Routes
│   │   ├── zones/
│   │   │   └── route.ts              # GET: 許可されたZone一覧取得
│   │   │
│   │   ├── dns/
│   │   │   └── [zoneId]/             # Zone別DNS管理
│   │   │       ├── route.ts          # GET: 一覧, POST: 作成
│   │   │       └── [id]/
│   │   │           └── route.ts      # GET: 詳細, PATCH: 更新, DELETE: 削除
│   │   │
│   │   ├── tunnels/
│   │   │   ├── route.ts              # GET: 一覧, POST: 作成
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET: 詳細, DELETE: 削除
│   │   │       ├── token/
│   │   │       │   └── route.ts      # GET: トークン取得
│   │   │       └── config/
│   │   │           └── route.ts      # GET/PUT: ingress設定
│   │   │
│   │   └── access/
│   │       ├── apps/
│   │       │   ├── route.ts          # GET: 一覧, POST: 作成
│   │       │   └── [appId]/
│   │       │       └── route.ts      # GET/PUT/DELETE
│   │       └── policies/             # 再利用可能ポリシー（アカウントレベル）
│   │           ├── route.ts          # GET: 一覧, POST: 作成
│   │           └── [policyId]/
│   │               └── route.ts      # GET/PUT/DELETE
│   │
│   ├── dns/
│   │   ├── page.tsx                  # DNS管理ページ（Zone選択 + レコード一覧）
│   │   ├── error.tsx                 # DNS管理エラーバウンダリ
│   │   ├── loading.tsx               # DNS管理ローディング
│   │   ├── [zoneId]/
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # DNS作成ページ
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx      # DNS編集ページ
│   │
│   ├── tunnels/
│   │   ├── page.tsx                  # Tunnel一覧ページ
│   │   ├── error.tsx                 # Tunnel管理エラーバウンダリ
│   │   ├── loading.tsx               # Tunnel管理ローディング
│   │   ├── new/
│   │   │   └── page.tsx              # Tunnel作成ページ
│   │   └── [id]/
│   │       ├── page.tsx              # Tunnel詳細ページ
│   │       └── config/
│   │           └── page.tsx          # Tunnel設定ページ
│   │
│   └── access/
│       ├── page.tsx                  # Access Apps一覧ページ
│       ├── error.tsx                 # Access管理エラーバウンダリ
│       ├── loading.tsx               # Access管理ローディング
│       ├── new/
│       │   └── page.tsx              # Access App作成ページ
│       ├── [appId]/
│       │   ├── page.tsx              # Access App詳細ページ
│       │   └── edit/
│       │       └── page.tsx          # Access App編集ページ
│       └── policies/                 # 再利用可能ポリシー
│           ├── page.tsx              # ポリシー一覧ページ
│           ├── new/
│           │   └── page.tsx          # ポリシー作成ページ
│           └── [policyId]/
│               └── edit/
│                   └── page.tsx      # ポリシー編集ページ
│
├── components/
│   ├── ui/                           # Shadcn/uiコンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx                 # エラー表示用Alert
│   │   ├── skeleton.tsx
│   │   └── form.tsx
│   │
│   ├── common/                       # 共通コンポーネント
│   │   ├── error-message.tsx         # インラインエラーメッセージ
│   │   ├── error-boundary-fallback.tsx  # エラーバウンダリのフォールバックUI
│   │   ├── loading-spinner.tsx       # ローディングスピナー
│   │   ├── page-skeleton.tsx         # ページ全体のスケルトン
│   │   ├── table-skeleton.tsx        # テーブルのスケルトン
│   │   └── empty-state.tsx           # データが空の場合の表示
│   │
│   ├── layout/
│   │   ├── sidebar.tsx               # サイドバーナビゲーション
│   │   ├── header.tsx                # ヘッダー
│   │   └── main-layout.tsx           # メインレイアウト
│   │
│   ├── dns/
│   │   ├── zone-selector.tsx         # Zone選択ドロップダウン
│   │   ├── dns-table.tsx             # DNSレコードテーブル
│   │   ├── dns-form.tsx              # DNS作成/編集フォーム
│   │   ├── dns-delete-dialog.tsx     # 削除確認ダイアログ
│   │   └── dns-type-badge.tsx        # レコードタイプバッジ
│   │
│   ├── tunnels/
│   │   ├── tunnel-table.tsx          # Tunnelテーブル
│   │   ├── tunnel-form.tsx           # Tunnel作成フォーム
│   │   ├── tunnel-token-dialog.tsx   # トークン表示ダイアログ
│   │   ├── tunnel-status-badge.tsx   # ステータスバッジ
│   │   ├── tunnel-delete-dialog.tsx  # 削除確認ダイアログ
│   │   └── tunnel-config-form.tsx    # Ingress設定フォーム
│   │
│   └── access/
│       ├── app-table.tsx             # Accessアプリテーブル
│       ├── app-form.tsx              # アプリ作成/編集フォーム
│       ├── policy-table.tsx          # 再利用可能ポリシーテーブル
│       ├── policy-form.tsx           # ポリシー作成/編集フォーム
│       ├── policy-selector.tsx       # アプリへのポリシー紐付けUI
│       ├── policy-usage-badge.tsx    # ポリシー使用数バッジ（app_count表示）
│       └── rule-builder.tsx          # ポリシールールビルダー
│
├── lib/
│   ├── utils.ts                      # ユーティリティ関数
│   ├── fetcher.ts                    # SWR用共通fetcher関数（ApiErrorクラス含む）
│   ├── api-response.ts               # API Routes用エラーレスポンスヘルパー
│   ├── cloudflare/
│   │   ├── client.ts                 # Cloudflare SDK初期化・設定
│   │   ├── zones.ts                  # Zone許可リスト管理（環境変数ベース）
│   │   ├── dns.ts                    # DNS サービス層（SDKラッパー）
│   │   ├── tunnels.ts                # Tunnel サービス層（SDKラッパー）
│   │   ├── access.ts                 # Access サービス層（SDKラッパー）
│   │   └── errors.ts                 # カスタムエラー定義
│   ├── validations/
│   │   ├── dns.ts                    # DNS用Zodスキーマ（入力バリデーション）
│   │   ├── tunnel.ts                 # Tunnel用Zodスキーマ（入力バリデーション）
│   │   └── access.ts                 # Access用Zodスキーマ（入力バリデーション）
│   └── constants.ts                  # 定数定義
│
├── types/
│   ├── zone.ts                       # Zone型定義（アプリ固有）
│   ├── dns.ts                        # DNS型定義（SDK型の再エクスポート + アプリ固有型）
│   ├── tunnel.ts                     # Tunnel型定義（SDK型の再エクスポート + アプリ固有型）
│   ├── access.ts                     # Access型定義（SDK型の再エクスポート + アプリ固有型）
│   └── errors.ts                     # エラー型定義
│
├── hooks/
│   ├── use-dns.ts                    # DNS用SWRフック（一覧取得 + CRUD操作 + 再検証）
│   ├── use-tunnels.ts                # Tunnel用SWRフック（一覧取得 + CRUD操作 + 再検証）
│   ├── use-access.ts                 # Access用SWRフック（Apps/Policies + 再検証）
│   ├── use-zones.ts                  # Zone一覧用SWRフック
│   └── use-toast.ts                  # Toast通知用
│
└── .env.local                        # 環境変数
```

### 3.2 内部API設計

#### Zones API Routes
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/zones` | GET | 許可されたZone一覧取得（名前、ID含む） |

#### DNS API Routes
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dns/[zoneId]` | GET | 指定ZoneのDNS一覧取得 |
| `/api/dns/[zoneId]` | POST | 指定ZoneにDNS作成 |
| `/api/dns/[zoneId]/[id]` | GET | DNS詳細取得 |
| `/api/dns/[zoneId]/[id]` | PATCH | DNS更新 |
| `/api/dns/[zoneId]/[id]` | DELETE | DNS削除 |

**注意**: `zoneId`は`CLOUDFLARE_ZONES`に含まれている必要がある

#### Tunnels API Routes
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tunnels` | GET | Tunnel一覧取得 |
| `/api/tunnels` | POST | Tunnel作成 |
| `/api/tunnels/[id]` | GET | Tunnel詳細取得 |
| `/api/tunnels/[id]` | DELETE | Tunnel削除 |
| `/api/tunnels/[id]/token` | GET | トークン取得 |
| `/api/tunnels/[id]/config` | GET | Ingress設定取得 |
| `/api/tunnels/[id]/config` | PUT | Ingress設定更新 |

#### Access API Routes

**Applications**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/access/apps` | GET | App一覧取得 |
| `/api/access/apps` | POST | App作成（policiesでポリシー紐付け可） |
| `/api/access/apps/[appId]` | GET | App詳細取得 |
| `/api/access/apps/[appId]` | PUT | App更新（policiesでポリシー紐付け変更可） |
| `/api/access/apps/[appId]` | DELETE | App削除 |

**Reusable Policies（再利用可能ポリシー）- 推奨**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/access/policies` | GET | 再利用可能ポリシー一覧取得 |
| `/api/access/policies` | POST | 再利用可能ポリシー作成 |
| `/api/access/policies/[policyId]` | GET | ポリシー詳細取得（app_count含む） |
| `/api/access/policies/[policyId]` | PUT | ポリシー更新（全連携アプリに反映） |
| `/api/access/policies/[policyId]` | DELETE | ポリシー削除 |

---

## 4. 環境変数

### 4.1 必須環境変数
```bash
# .env.local
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# 管理対象のZone情報（Zone ID:ドメイン名の形式でカンマ区切り）
# 指定したZoneのみがUI上に表示され、操作可能になる
# フォーマット: zone_id_1:example.com,zone_id_2:example.org
CLOUDFLARE_ZONES=abc123def456:example.com,xyz789ghi012:mysite.org
```

### 4.2 複数Zone管理の仕組み
- **静的設定方式**: `CLOUDFLARE_ZONES`にZone IDとドメイン名をペアで指定
- **API呼び出し不要**: Zone情報取得のためのCloudflare API呼び出しが不要でシンプル
- **Zone選択UI**: DNS管理画面ではドロップダウンで対象Zoneを選択（ドメイン名で表示）
- **セキュリティ**: 許可リストにないZoneへの操作は拒否される

```typescript
// lib/cloudflare/zones.ts
import { AllowedZone } from '@/types/zone';

export function getAllowedZones(): AllowedZone[] {
  const zonesEnv = process.env.CLOUDFLARE_ZONES || '';
  return zonesEnv
    .split(',')
    .map(entry => {
      const [id, name] = entry.trim().split(':');
      return { id, name };
    })
    .filter(zone => zone.id && zone.name);
}

export function isZoneAllowed(zoneId: string): boolean {
  return getAllowedZones().some(zone => zone.id === zoneId);
}

export function getZoneById(zoneId: string): AllowedZone | undefined {
  return getAllowedZones().find(zone => zone.id === zoneId);
}
```

### 4.3 APIトークン権限要件
Cloudflare Dashboard → My Profile → API Tokens で以下の権限を持つトークンを作成:

| 権限 | スコープ | 用途 |
|------|---------|------|
| Zone:DNS:Edit | 対象ゾーン（複数可） | DNSレコード管理 |
| Account:Cloudflare Tunnel:Edit | 対象アカウント | Tunnel管理 |
| Account:Access: Apps and Policies:Edit | 対象アカウント | Access管理 |

**注**: Zone情報（ID・ドメイン名）は環境変数で静的に設定するため、`Zone:Zone:Read`権限は不要

---

## 5. データフロー

### 5.1 アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application                           │
│  ┌───────────────────────┐    ┌───────────────────────────────┐ │
│  │   Server Components   │    │      Client Components        │ │
│  │   (Data Fetching)     │    │   (User Interaction)          │ │
│  └───────────────────────┘    └───────────────────────────────┘ │
│              │                              │                    │
│              ▼                              ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     API Routes                               ││
│  │  /api/dns  |  /api/tunnels  |  /api/access                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │            lib/cloudflare/ (サービス層)                      ││
│  │     dns.ts  |  tunnels.ts  |  access.ts  |  zones.ts        ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │               lib/cloudflare/client.ts                       ││
│  │         (Cloudflare SDK初期化 + 設定)                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              cloudflare (公式SDK v5.x)                       ││
│  │      自動リトライ | 型安全 | 認証管理 | エラーハンドリング    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cloudflare API                              │
│        https://api.cloudflare.com/client/v4                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 データフェッチ・再検証戦略

#### 採用ライブラリ
- **SWR** (stale-while-revalidate) - クライアントサイドデータフェッチ・キャッシュ管理

#### 選定理由
- Next.js（Vercel）公式推奨のデータフェッチライブラリ
- `mutate()`による簡単な再検証（CRUD後のデータ同期）
- 軽量（約4KB gzip）
- 自動再検証（フォーカス時、再接続時）
- TypeScriptフレンドリー

#### データフェッチパターン
| 操作 | 方法 | 再検証 |
|------|------|--------|
| 一覧取得 | `useSWR('/api/dns/[zoneId]')` | 自動（フォーカス時等） |
| 作成後 | `mutate('/api/dns/[zoneId]')` | 即座に再取得 |
| 更新後 | `mutate('/api/dns/[zoneId]')` | 即座に再取得 |
| 削除後 | `mutate('/api/dns/[zoneId]')` | 即座に再取得 |

#### 実装例

```typescript
// lib/fetcher.ts - 共通fetcher関数
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'An error occurred');
  }
  return res.json();
}
```

```typescript
// hooks/use-dns.ts - DNSレコード用SWRフック
import useSWR, { useSWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { DnsRecord, DnsCreateInput, DnsUpdateInput } from '@/types/dns';

interface DnsRecordsResponse {
  records: DnsRecord[];
}

export function useDnsRecords(zoneId: string | null) {
  const { data, error, isLoading } = useSWR<DnsRecordsResponse>(
    zoneId ? `/api/dns/${zoneId}` : null,
    fetcher
  );

  return {
    records: data?.records ?? [],
    isLoading,
    isError: !!error,
    error,
  };
}

export function useDnsRecordMutations(zoneId: string) {
  const { mutate } = useSWRConfig();
  const key = `/api/dns/${zoneId}`;

  const createRecord = async (data: DnsCreateInput) => {
    const res = await fetch(key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create record');
    await mutate(key); // 一覧を再検証
    return res.json();
  };

  const updateRecord = async (recordId: string, data: DnsUpdateInput) => {
    const res = await fetch(`${key}/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update record');
    await mutate(key); // 一覧を再検証
    return res.json();
  };

  const deleteRecord = async (recordId: string) => {
    const res = await fetch(`${key}/${recordId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete record');
    await mutate(key); // 一覧を再検証
  };

  return { createRecord, updateRecord, deleteRecord };
}
```

```typescript
// コンポーネントでの使用例
// components/dns/dns-table.tsx
'use client';
import { useDnsRecords, useDnsRecordMutations } from '@/hooks/use-dns';

export function DnsTable({ zoneId }: { zoneId: string }) {
  const { records, isLoading, isError } = useDnsRecords(zoneId);
  const { deleteRecord } = useDnsRecordMutations(zoneId);

  if (isLoading) return <TableSkeleton />;
  if (isError) return <ErrorMessage />;

  const handleDelete = async (recordId: string) => {
    await deleteRecord(recordId);
    toast.success('Record deleted');
  };

  return (
    <Table>
      {records.map(record => (
        <TableRow key={record.id}>
          {/* ... */}
        </TableRow>
      ))}
    </Table>
  );
}
```

```typescript
// hooks/use-tunnels.ts - Tunnel用SWRフック
import useSWR, { useSWRConfig } from 'swr';
import { fetcher, ApiError } from '@/lib/fetcher';
import type { Tunnel, TunnelConfig, TunnelCreateInput, IngressUpdateInput } from '@/types/tunnel';

interface TunnelsResponse {
  tunnels: Tunnel[];
}

interface TunnelResponse {
  tunnel: Tunnel;
}

interface TunnelTokenResponse {
  token: string;
}

interface TunnelConfigResponse {
  config: TunnelConfig;
}

// Tunnel一覧取得
export function useTunnels() {
  const { data, error, isLoading, mutate } = useSWR<TunnelsResponse, ApiError>(
    '/api/tunnels',
    fetcher
  );

  return {
    tunnels: data?.tunnels ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Tunnel詳細取得
export function useTunnel(tunnelId: string | null) {
  const { data, error, isLoading } = useSWR<TunnelResponse, ApiError>(
    tunnelId ? `/api/tunnels/${tunnelId}` : null,
    fetcher
  );

  return {
    tunnel: data?.tunnel ?? null,
    isLoading,
    isError: !!error,
    error,
  };
}

// Tunnelトークン取得（オンデマンド）
export function useTunnelToken(tunnelId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TunnelTokenResponse, ApiError>(
    tunnelId ? `/api/tunnels/${tunnelId}/token` : null,
    fetcher,
    {
      revalidateOnFocus: false,  // トークンは自動再取得しない
      revalidateOnReconnect: false,
    }
  );

  return {
    token: data?.token ?? null,
    isLoading,
    isError: !!error,
    error,
    refetch: mutate,  // 手動再取得用
  };
}

// Tunnel Ingress設定取得
export function useTunnelConfig(tunnelId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TunnelConfigResponse, ApiError>(
    tunnelId ? `/api/tunnels/${tunnelId}/config` : null,
    fetcher
  );

  return {
    config: data?.config ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Tunnel CRUD操作
export function useTunnelMutations() {
  const { mutate } = useSWRConfig();
  const listKey = '/api/tunnels';

  const createTunnel = async (data: TunnelCreateInput) => {
    const res = await fetch(listKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create tunnel');
    await mutate(listKey);
    return res.json();
  };

  const deleteTunnel = async (tunnelId: string) => {
    const res = await fetch(`${listKey}/${tunnelId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete tunnel');
    await mutate(listKey);
  };

  return { createTunnel, deleteTunnel };
}

// Tunnel Ingress設定更新
// 注意: IngressUpdateInputはUIフォーム入力形式（zoneId + subdomain）
// API Routeでhostnameに変換してCloudflare APIに送信する
export function useTunnelConfigMutations(tunnelId: string) {
  const { mutate } = useSWRConfig();
  const configKey = `/api/tunnels/${tunnelId}/config`;

  const updateConfig = async (data: IngressUpdateInput) => {
    const res = await fetch(configKey, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update tunnel config');
    await mutate(configKey);
    return res.json();
  };

  return { updateConfig };
}
```

```typescript
// hooks/use-access.ts - Access用SWRフック
import useSWR, { useSWRConfig } from 'swr';
import { fetcher, ApiError } from '@/lib/fetcher';
import type {
  AccessApplication,
  AccessPolicy,
  AccessAppCreateInput,
  AccessAppUpdateInput,
  PolicyCreateInput,
  PolicyUpdateInput,
} from '@/types/access';

// ============================================
// Applications フック
// ============================================

interface AccessAppsResponse {
  apps: AccessApplication[];
}

interface AccessAppResponse {
  app: AccessApplication;
}

// Access App一覧取得
export function useAccessApps() {
  const { data, error, isLoading, mutate } = useSWR<AccessAppsResponse, ApiError>(
    '/api/access/apps',
    fetcher
  );

  return {
    apps: data?.apps ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Access App詳細取得
export function useAccessApp(appId: string | null) {
  const { data, error, isLoading } = useSWR<AccessAppResponse, ApiError>(
    appId ? `/api/access/apps/${appId}` : null,
    fetcher
  );

  return {
    app: data?.app ?? null,
    isLoading,
    isError: !!error,
    error,
  };
}

// Access App CRUD操作
export function useAccessAppMutations() {
  const { mutate } = useSWRConfig();
  const listKey = '/api/access/apps';

  const createApp = async (data: AccessAppCreateInput) => {
    const res = await fetch(listKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create access app');
    await mutate(listKey);
    return res.json();
  };

  const updateApp = async (appId: string, data: AccessAppUpdateInput) => {
    const res = await fetch(`${listKey}/${appId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update access app');
    await mutate(listKey);
    return res.json();
  };

  const deleteApp = async (appId: string) => {
    const res = await fetch(`${listKey}/${appId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete access app');
    await mutate(listKey);
  };

  return { createApp, updateApp, deleteApp };
}

// ============================================
// Reusable Policies フック
// ============================================

interface AccessPoliciesResponse {
  policies: AccessPolicy[];
}

interface AccessPolicyResponse {
  policy: AccessPolicy & { app_count?: number };
}

// 再利用可能ポリシー一覧取得
export function useAccessPolicies() {
  const { data, error, isLoading, mutate } = useSWR<AccessPoliciesResponse, ApiError>(
    '/api/access/policies',
    fetcher
  );

  return {
    policies: data?.policies ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// 再利用可能ポリシー詳細取得（app_count含む）
export function useAccessPolicy(policyId: string | null) {
  const { data, error, isLoading } = useSWR<AccessPolicyResponse, ApiError>(
    policyId ? `/api/access/policies/${policyId}` : null,
    fetcher
  );

  return {
    policy: data?.policy ?? null,
    isLoading,
    isError: !!error,
    error,
  };
}

// 再利用可能ポリシー CRUD操作
export function useAccessPolicyMutations() {
  const { mutate } = useSWRConfig();
  const listKey = '/api/access/policies';

  const createPolicy = async (data: PolicyCreateInput) => {
    const res = await fetch(listKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create policy');
    await mutate(listKey);
    return res.json();
  };

  const updatePolicy = async (policyId: string, data: PolicyUpdateInput) => {
    const res = await fetch(`${listKey}/${policyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update policy');
    await mutate(listKey);
    // ポリシー更新は連携アプリにも影響するため、apps一覧も再検証
    await mutate('/api/access/apps');
    return res.json();
  };

  const deletePolicy = async (policyId: string) => {
    const res = await fetch(`${listKey}/${policyId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete policy');
    await mutate(listKey);
  };

  return { createPolicy, updatePolicy, deletePolicy };
}
```

```typescript
// コンポーネントでの使用例
// components/tunnels/tunnel-table.tsx
'use client';
import { useTunnels, useTunnelMutations } from '@/hooks/use-tunnels';

export function TunnelTable() {
  const { tunnels, isLoading, isError } = useTunnels();
  const { deleteTunnel } = useTunnelMutations();

  if (isLoading) return <TableSkeleton />;
  if (isError) return <ErrorMessage />;

  const handleDelete = async (tunnelId: string) => {
    await deleteTunnel(tunnelId);
    toast.success('Tunnel deleted');
  };

  return (
    <Table>
      {tunnels.map(tunnel => (
        <TableRow key={tunnel.id}>
          {/* ... */}
        </TableRow>
      ))}
    </Table>
  );
}
```

```typescript
// コンポーネントでの使用例
// components/access/policy-table.tsx
'use client';
import { useAccessPolicies, useAccessPolicyMutations } from '@/hooks/use-access';

export function PolicyTable() {
  const { policies, isLoading, isError } = useAccessPolicies();
  const { deletePolicy } = useAccessPolicyMutations();

  if (isLoading) return <TableSkeleton />;
  if (isError) return <ErrorMessage />;

  const handleDelete = async (policyId: string) => {
    await deletePolicy(policyId);
    toast.success('Policy deleted');
  };

  return (
    <Table>
      {policies.map(policy => (
        <TableRow key={policy.id}>
          <TableCell>{policy.name}</TableCell>
          <TableCell>
            <PolicyUsageBadge count={policy.app_count} />
          </TableCell>
          {/* ... */}
        </TableRow>
      ))}
    </Table>
  );
}
```

### 5.3 Cloudflare SDK使用パターン

```typescript
// lib/cloudflare/client.ts - SDK初期化
import Cloudflare from 'cloudflare';

// シングルトンパターンでSDKクライアントを初期化
export const cloudflare = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
});

// アカウントIDの取得
export const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
```

```typescript
// lib/cloudflare/dns.ts - DNSサービス層
import { cloudflare } from './client';
import { isZoneAllowed } from './zones';
import { CloudflareServiceError } from './errors';

export async function listDnsRecords(zoneId: string) {
  // Zone許可チェック
  if (!isZoneAllowed(zoneId)) {
    throw new CloudflareServiceError('Zone not allowed', 'ZONE_NOT_ALLOWED');
  }

  // SDKを使用してDNSレコードを取得
  const records = await cloudflare.dns.records.list({
    zone_id: zoneId,
  });

  return records.result;
}

export async function createDnsRecord(zoneId: string, data: DnsCreateInput) {
  if (!isZoneAllowed(zoneId)) {
    throw new CloudflareServiceError('Zone not allowed', 'ZONE_NOT_ALLOWED');
  }

  const record = await cloudflare.dns.records.create({
    zone_id: zoneId,
    ...data,
  });

  return record;
}
```

```typescript
// lib/cloudflare/tunnels.ts - Tunnelサービス層
import crypto from 'crypto';
import { cloudflare, accountId } from './client';
import { CloudflareServiceError } from './errors';

export async function createTunnel(name: string) {
  // シークレットを自動生成
  const tunnelSecret = crypto.randomBytes(32).toString('base64');

  // SDKを使用してTunnelを作成
  const tunnel = await cloudflare.zeroTrust.tunnels.create({
    account_id: accountId,
    name,
    tunnel_secret: tunnelSecret,
  });

  return tunnel;
}

/**
 * Tunnel Token を取得する
 *
 * @param tunnelId - Tunnel UUID
 * @returns cloudflared tunnel run --token で使用する JWT トークン
 */
export async function getTunnelToken(tunnelId: string): Promise<string> {
  // SDK v5.x で token 取得メソッドが追加されている
  const token = await cloudflare.zeroTrust.tunnels.cloudflared.token.get(
    tunnelId,
    { account_id: accountId }
  );

  return token;
}

/**
 * Ingress設定を更新する
 *
 * UIフォーム入力（zoneId + subdomain形式）をCloudflare API形式（hostname）に変換して送信
 *
 * @param tunnelId - Tunnel UUID
 * @param rules - UIフォームからの入力（IngressRuleInput[]）
 */
export async function updateTunnelConfig(
  tunnelId: string,
  rules: IngressRuleInput[]
): Promise<void> {
  // UIフォーム入力をCloudflare API形式に変換
  const ingress: IngressRule[] = rules.map(rule => {
    const zone = getZoneById(rule.zoneId);
    if (!zone) {
      throw new CloudflareServiceError(
        `Zone not found: ${rule.zoneId}`,
        'ZONE_NOT_ALLOWED'
      );
    }

    // subdomain + zone.name → hostname
    const hostname = rule.subdomain
      ? `${rule.subdomain}.${zone.name}`
      : zone.name;

    return {
      hostname,
      service: rule.service,
      ...(rule.path && { path: rule.path }),
    };
  });

  // Catch-all ルールを追加（必須）
  ingress.push({ service: 'http_status:404' });

  // SDKを使用してIngress設定を更新
  await cloudflare.zeroTrust.tunnels.configurations.update({
    account_id: accountId,
    tunnel_id: tunnelId,
    config: { ingress },
  });
}
```

```typescript
// lib/cloudflare/errors.ts - カスタムエラー
export type CloudflareErrorCode =
  | 'ZONE_NOT_ALLOWED'
  | 'RESOURCE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

export class CloudflareServiceError extends Error {
  constructor(
    message: string,
    public code: CloudflareErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CloudflareServiceError';
  }
}
```

---

## 6. セキュリティ要件

### 6.1 認証情報の保護
- APIトークンはサーバーサイドのみでアクセス
- クライアントコンポーネントには認証情報を渡さない
- 環境変数は`.env.local`で管理し、Gitにコミットしない

### 6.2 入力バリデーション
- 全ての入力値をZodスキーマでバリデーション
- サーバーサイドで再度バリデーション実行
- エラーメッセージで詳細情報を漏らさない

### 6.3 トークン表示の安全性
- Tunnelトークンは作成直後のダイアログでのみ表示
- ダイアログを閉じると再取得不可（APIは存在するが、UIでは再表示しない設計）
- クリップボードコピー後に視覚的フィードバック

### 6.4 レート制限対策
- Cloudflare APIは5分間に1,200リクエストの制限
- 必要に応じてクライアント側でレート制限を実装

---

## 7. 実装フェーズ

### Phase 0: SDK検証（実装前必須）

**目的**: Cloudflare SDK v5.x の実際の型構造・API構造を検証し、仕様書の型定義・コードサンプルを修正する

#### 検証タスク

1. **SDKインストールと型構造確認**
   ```bash
   npm install cloudflare
   ```
   - `node_modules/cloudflare/` 配下の `.d.ts` ファイルを確認
   - 実際のエクスポート構造を把握

2. **DNS API 型検証**
   - `cloudflare.dns.records.list()` の戻り値型を確認
   - `DNS.Record` が実際に存在するか、正しいインポートパスを特定
   - レコードタイプの列挙型を確認

3. **Tunnel API 型検証**
   - `cloudflare.zeroTrust.tunnels` の存在確認
   - Tunnel作成・設定更新のメソッドシグネチャを確認
   - `ZeroTrust.Tunnel` 型の実際のインポートパスを特定

4. **Access API 型検証**
   - `cloudflare.zeroTrust.access` の構造を確認
   - アプリケーション・ポリシーの型を特定
   - 再利用可能ポリシーAPIの対応状況を確認

5. **API呼び出しパターン検証**
   - 簡易スクリプトで実際にAPI呼び出しをテスト
   - エラーレスポンスの形式を確認
   - ページネーションの仕組みを確認

#### 成果物

- [x] 型定義セクション（8章）の修正
- [x] コードサンプルの修正（5.3 Cloudflare SDK使用パターン）
- [x] SDK APIカバレッジ確認（トークン取得含め全API対応済み）

#### 検証用スクリプト例

```typescript
// scripts/verify-sdk.ts
import Cloudflare from 'cloudflare';

const cf = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
});

async function verify() {
  // DNS Records
  const dnsRecords = await cf.dns.records.list({
    zone_id: 'test-zone-id',
  });
  console.log('DNS Record type:', typeof dnsRecords);

  // Tunnels
  const tunnels = await cf.zeroTrust.tunnels.list({
    account_id: 'test-account-id',
  });
  console.log('Tunnel type:', typeof tunnels);

  // Access Apps
  const apps = await cf.zeroTrust.access.applications.list({
    account_id: 'test-account-id',
  });
  console.log('Access App type:', typeof apps);
}

verify().catch(console.error);
```

**重要**: Phase 0 完了まで Phase 1 以降の実装を開始しないこと

---

### Phase 1: 基盤構築
1. パッケージインストール (`cloudflare`, `zod`, `react-hook-form`, `@hookform/resolvers`, `swr`)
2. Shadcn/uiコンポーネント追加
3. 型定義 - エラー型・Zone型 (`types/errors.ts`, `types/zone.ts`)
4. Cloudflare SDK初期化 (`lib/cloudflare/client.ts`)
5. カスタムエラー定義 (`lib/cloudflare/errors.ts`)
6. Zone許可リスト管理 (`lib/cloudflare/zones.ts`)
7. レイアウトコンポーネント構築 (`components/layout/`)
8. 共通データフェッチ基盤 (`lib/fetcher.ts`) - ApiErrorクラス含む
9. APIエラーレスポンスヘルパー (`lib/api-response.ts`)
10. 共通UIコンポーネント (`components/common/`) - エラーメッセージ、スケルトン、空状態
11. グローバルエラー/ローディング (`app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`)
12. Toast通知フック (`hooks/use-toast.ts`)

### Phase 2: DNS管理機能
1. 型定義 - DNS型 (`types/dns.ts`)
2. Zone API Route (`app/api/zones/route.ts`) - 許可Zone一覧エンドポイント
3. Zone用SWRフック (`hooks/use-zones.ts`)
4. DNSサービス層実装 (`lib/cloudflare/dns.ts`) - SDKラッパー
5. DNS バリデーション (`lib/validations/dns.ts`)
6. DNS用SWRフック (`hooks/use-dns.ts`)
7. DNS API Routes (`app/api/dns/`)
8. DNS コンポーネント (`components/dns/`)
9. DNS ページ (`app/dns/`)
10. DNS用エラー/ローディング (`app/dns/error.tsx`, `app/dns/loading.tsx`)

### Phase 3: Tunnel管理機能
1. 型定義 - Tunnel型 (`types/tunnel.ts`)
2. Tunnelサービス層実装 (`lib/cloudflare/tunnels.ts`) - SDKラッパー
3. Tunnel バリデーション (`lib/validations/tunnel.ts`)
4. Tunnel用SWRフック (`hooks/use-tunnels.ts`)
5. Tunnel API Routes (`app/api/tunnels/`)
6. Tunnel コンポーネント (`components/tunnels/`)
7. Tunnel ページ (`app/tunnels/`)
8. Tunnel用エラー/ローディング (`app/tunnels/error.tsx`, `app/tunnels/loading.tsx`)

### Phase 4: Access管理機能
1. 型定義 - Access型 (`types/access.ts`)
2. Accessサービス層実装 (`lib/cloudflare/access.ts`) - SDKラッパー
3. Access バリデーション (`lib/validations/access.ts`)
4. Access用SWRフック (`hooks/use-access.ts`)
5. Access API Routes (`app/api/access/`)
6. Access コンポーネント (`components/access/`)
7. Access ページ (`app/access/`)
8. Access用エラー/ローディング (`app/access/error.tsx`, `app/access/loading.tsx`)

### Phase 5: 仕上げ
1. ダッシュボード (`app/page.tsx`)
2. レスポンシブ対応

---

## 8. 型定義

### 8.1 型定義方針

Cloudflare公式SDKを使用するため、**SDK提供の型を最大限活用**する。

```typescript
// types/dns.ts - SDKの型を再エクスポート + アプリ固有型
import type { DNS } from 'cloudflare';

// SDKの型を再エクスポート（必要に応じて）
export type DnsRecord = DNS.Record;
export type DnsRecordType = DNS.RecordType;

// アプリ固有の入力型（フォーム用）
export interface DnsCreateInput {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}
```

**方針:**
- **SDK型を信頼**: Cloudflare APIの型はSDKが提供するものを使用
- **再エクスポート**: 必要に応じてアプリ内で使いやすい名前でエクスポート
- **アプリ固有型**: フォーム入力やUI表示用の型はアプリ側で定義
- **Zodスキーマ**: 入力バリデーションはZodで定義（SDKの型とは別）

### 8.2 エラー型 (`types/errors.ts`)
```typescript
// アプリ固有のエラー型
export type CloudflareErrorCode =
  | 'ZONE_NOT_ALLOWED'
  | 'RESOURCE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

export interface AppError {
  code: CloudflareErrorCode;
  message: string;
  details?: unknown;
}
```

### 8.3 Zone型 (`types/zone.ts`)
```typescript
// UIで表示する許可済みZone（環境変数から取得）
export interface AllowedZone {
  id: string;
  name: string;  // ドメイン名（例: example.com）
}
```

### 8.4 DNS型 (`types/dns.ts`)
```typescript
import type { DNS } from 'cloudflare';

// SDKの型を再エクスポート
export type DnsRecord = DNS.Record;

// アプリで使用するレコードタイプ（SDKの型を参照）
export type DnsRecordType =
  | 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT'
  | 'NS' | 'SRV' | 'CAA';

// フォーム入力用の型
export interface DnsCreateInput {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}

export interface DnsUpdateInput extends DnsCreateInput {}
```

### 8.5 Tunnel型 (`types/tunnel.ts`)
```typescript
import type { ZeroTrust } from 'cloudflare';

// SDKの型を再エクスポート
export type Tunnel = ZeroTrust.Tunnel;
export type TunnelConnection = ZeroTrust.TunnelConnection;

// Ingress設定用の型（Cloudflare APIに送信する形式）
export interface IngressRule {
  hostname?: string;
  service: string;
  path?: string;
}

export interface TunnelConfig {
  ingress: IngressRule[];
  warp_routing?: {
    enabled: boolean;
  };
}

// フォーム入力用の型（tunnel_secretはサービス層で自動生成）
export interface TunnelCreateInput {
  name: string;
}

// UIフォーム入力用のIngress型（Zone選択 + subdomain入力形式）
export interface IngressRuleInput {
  zoneId: string;      // 選択したZone ID
  subdomain: string;   // サブドメイン部分のみ（例: "app"）
  service: string;     // 転送先サービスURL
  path?: string;       // パスパターン（オプション）
}

export interface IngressUpdateInput {
  rules: IngressRuleInput[];
}
```

### 8.6 Access型 (`types/access.ts`)
```typescript
import type { ZeroTrust } from 'cloudflare';

// SDKの型を再エクスポート
export type AccessApplication = ZeroTrust.AccessApplication;
export type AccessPolicy = ZeroTrust.AccessPolicy;

// ポリシー参照（アプリへの紐付け用）
export interface PolicyReference {
  id: string;
  name?: string;  // 表示用
}

// アプリで使用するアクセスルール型
export interface AccessRule {
  email_domain?: { domain: string };
  email?: { email: string };
  group?: { id: string };
  geo?: { country: string };
  device_posture?: { integration_uid: string };
  everyone?: Record<string, never>;
}

// フォーム入力用の型
export interface AccessAppCreateInput {
  name: string;
  domain: string;
  type: 'self_hosted';
  session_duration?: string;
  app_launcher_visible?: boolean;
  policies?: PolicyReference[];
}

export interface AccessAppUpdateInput extends AccessAppCreateInput {}

export interface PolicyCreateInput {
  name: string;
  precedence: number;
  decision: 'allow' | 'deny' | 'bypass';
  include: AccessRule[];
  exclude?: AccessRule[];
  require?: AccessRule[];
  session_duration?: string;
  approval_required?: boolean;
}

export interface PolicyUpdateInput extends PolicyCreateInput {}
```

---

## 10. エラーハンドリングUI設計

### 10.1 ディレクトリ構造（追加分）

```
cloudflare-tunnel-manager/
├── app/
│   ├── error.tsx                     # グローバルエラーバウンダリ
│   ├── not-found.tsx                 # 404ページ
│   ├── loading.tsx                   # グローバルローディング
│   │
│   ├── dns/
│   │   ├── error.tsx                 # DNS管理エラーバウンダリ
│   │   └── loading.tsx               # DNS管理ローディング
│   │
│   ├── tunnels/
│   │   ├── error.tsx                 # Tunnel管理エラーバウンダリ
│   │   └── loading.tsx               # Tunnel管理ローディング
│   │
│   └── access/
│       ├── error.tsx                 # Access管理エラーバウンダリ
│       └── loading.tsx               # Access管理ローディング
│
├── components/
│   ├── ui/
│   │   ├── alert.tsx                 # Shadcn/ui Alert（エラー表示用）
│   │   └── ... (既存)
│   │
│   └── common/
│       ├── error-message.tsx         # インラインエラーメッセージ
│       ├── error-boundary-fallback.tsx  # エラーバウンダリのフォールバックUI
│       ├── loading-spinner.tsx       # ローディングスピナー
│       ├── page-skeleton.tsx         # ページ全体のスケルトン
│       ├── table-skeleton.tsx        # テーブルのスケルトン
│       └── empty-state.tsx           # データが空の場合の表示
```

### 10.2 エラーバウンダリ設計

#### グローバルエラーバウンダリ (`app/error.tsx`)
```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // エラーログ送信（必要に応じて）
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="text-muted-foreground text-center max-w-md">
        予期しないエラーが発生しました。問題が解決しない場合は、ページを再読み込みしてください。
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>再試行</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          ダッシュボードへ
        </Button>
      </div>
    </div>
  );
}
```

#### セクション別エラーバウンダリ（例: `app/dns/error.tsx`）
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DnsError({ error, reset }: ErrorProps) {
  // Cloudflare API固有のエラーハンドリング
  const isRateLimited = error.message.includes('RATE_LIMITED');
  const isUnauthorized = error.message.includes('UNAUTHORIZED');

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">DNS管理でエラーが発生しました</h2>

      {isRateLimited && (
        <p className="text-muted-foreground text-center max-w-md">
          APIレート制限に達しました。しばらく待ってから再試行してください。
        </p>
      )}

      {isUnauthorized && (
        <p className="text-muted-foreground text-center max-w-md">
          APIトークンの権限が不足しています。設定を確認してください。
        </p>
      )}

      {!isRateLimited && !isUnauthorized && (
        <p className="text-muted-foreground text-center max-w-md">
          DNSレコードの取得中にエラーが発生しました。
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          再試行
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">ダッシュボードへ</Link>
        </Button>
      </div>
    </div>
  );
}
```

### 10.3 Not Foundページ (`app/not-found.tsx`)

```typescript
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">ページが見つかりません</h2>
      <p className="text-muted-foreground text-center max-w-md">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Button asChild>
        <Link href="/">ダッシュボードへ戻る</Link>
      </Button>
    </div>
  );
}
```

### 10.4 ローディングUI設計

#### グローバルローディング (`app/loading.tsx`)
```typescript
import { PageSkeleton } from '@/components/common/page-skeleton';

export default function Loading() {
  return <PageSkeleton />;
}
```

#### セクション別ローディング（例: `app/dns/loading.tsx`）
```typescript
import { TableSkeleton } from '@/components/common/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function DnsLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Zone選択 */}
      <Skeleton className="h-10 w-64" />

      {/* テーブル */}
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}
```

### 10.5 共通コンポーネント設計

#### インラインエラーメッセージ (`components/common/error-message.tsx`)
```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, XCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'default' | 'destructive';
  onRetry?: () => void;
}

export function ErrorMessage({
  title = 'エラー',
  message,
  variant = 'destructive',
  onRetry
}: ErrorMessageProps) {
  return (
    <Alert variant={variant}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            再試行
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

#### テーブルスケルトン (`components/common/table-skeleton.tsx`)
```typescript
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

#### 空状態表示 (`components/common/empty-state.tsx`)
```typescript
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8">
      <Icon className="h-12 w-12 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
```

### 10.6 API Routesエラーレスポンス設計

#### 統一エラーレスポンス形式
```typescript
// lib/api-response.ts
import { NextResponse } from 'next/server';
import { CloudflareServiceError } from '@/lib/cloudflare/errors';

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function createErrorResponse(
  error: unknown,
  defaultStatus = 500
): NextResponse<ApiErrorResponse> {
  if (error instanceof CloudflareServiceError) {
    const statusMap: Record<string, number> = {
      ZONE_NOT_ALLOWED: 403,
      RESOURCE_NOT_FOUND: 404,
      VALIDATION_ERROR: 400,
      RATE_LIMITED: 429,
      UNAUTHORIZED: 401,
      UNKNOWN: 500,
    };

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: statusMap[error.code] || defaultStatus }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'UNKNOWN',
        message: 'An unexpected error occurred',
      },
    },
    { status: defaultStatus }
  );
}
```

#### API Routeでの使用例
```typescript
// app/api/dns/[zoneId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listDnsRecords } from '@/lib/cloudflare/dns';
import { createErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const records = await listDnsRecords(params.zoneId);
    return NextResponse.json({ records });
  } catch (error) {
    return createErrorResponse(error);
  }
}
```

### 10.7 SWRエラーハンドリング統合

#### エラー付きfetcher関数
```typescript
// lib/fetcher.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      errorData.error?.message || 'An error occurred',
      errorData.error?.code || 'UNKNOWN',
      res.status,
      errorData.error?.details
    );
  }

  return res.json();
}
```

#### SWRフックでのエラーハンドリング
```typescript
// hooks/use-dns.ts
import useSWR from 'swr';
import { fetcher, ApiError } from '@/lib/fetcher';

export function useDnsRecords(zoneId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DnsRecordsResponse, ApiError>(
    zoneId ? `/api/dns/${zoneId}` : null,
    fetcher,
    {
      // エラー時のリトライ設定
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      // レート制限エラーは長めに待つ
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
          setTimeout(() => revalidate({ retryCount }), 30000);
          return;
        }
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 1000 * (retryCount + 1));
      },
    }
  );

  return {
    records: data?.records ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
```

### 10.8 エラー種別と表示対応表

| エラーコード | HTTPステータス | 表示メッセージ | アクション |
|-------------|---------------|---------------|-----------|
| ZONE_NOT_ALLOWED | 403 | 指定されたZoneへのアクセス権限がありません | ダッシュボードへ戻る |
| RESOURCE_NOT_FOUND | 404 | リソースが見つかりません | 一覧へ戻る |
| VALIDATION_ERROR | 400 | 入力内容に誤りがあります | フォーム修正 |
| RATE_LIMITED | 429 | APIレート制限に達しました | 30秒後に自動再試行 |
| UNAUTHORIZED | 401 | 認証エラー：APIトークンを確認してください | 設定確認 |
| UNKNOWN | 500 | 予期しないエラーが発生しました | 再試行ボタン |

---

## 11. 参考リンク

### Cloudflare SDK & API
- [cloudflare npm package](https://www.npmjs.com/package/cloudflare) - 公式TypeScript SDK
- [cloudflare-typescript GitHub](https://github.com/cloudflare/cloudflare-typescript) - SDKソースコード
- [Cloudflare API SDKs](https://developers.cloudflare.com/fundamentals/api/reference/sdks/) - SDK公式ドキュメント

### Cloudflare API Reference
- [DNS Records API](https://developers.cloudflare.com/api/resources/dns/)
- [Cloudflare Tunnel API](https://developers.cloudflare.com/api/resources/zero_trust/subresources/tunnels/)
- [Access Applications API](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/)

### Framework Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Shadcn/ui](https://ui.shadcn.com/)
- [SWR](https://swr.vercel.app/)
- [Zod](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
