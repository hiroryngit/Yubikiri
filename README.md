# Yubikiri - 口約束からの脱却

個人間の合意をデータベースで証拠化する軽量デジタル合意システム。

PDFや紙の契約書を使わず、タイムスタンプ・位置情報・ブラウザ情報などのメタデータで合意の事実を証明します。UUID ベースの URL で共有し、知っている人だけがアクセスできます。

## 主な機能

- **合意書の作成・共有** - タイトルと内容を入力し、UUID ベースの URL で共有
- **対象者の指定** - 特定のメールアドレス宛て、または誰でも同意可能
- **合意アクション** - 承諾・拒否・再リクエスト・撤回・取消（二段階承認）・編集
- **改ざん検知** - SHA-256 ハッシュによるコンテンツ整合性の検証
- **証拠記録** - タイムスタンプ、User Agent、IP アドレス、国・地域情報を自動記録
- **不変の操作ログ** - すべてのアクションを追記専用の `agreement_logs` に記録
- **33 言語対応** - AI 翻訳によるリアルタイム翻訳（プロバイダーフォールバック付き）
- **認証** - メール/パスワード + Google OAuth（Supabase Auth）
- **ダッシュボード** - 作成した合意書・関連する合意書を一覧管理

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 19 (App Router), React 19, TypeScript 5 |
| スタイリング | Tailwind CSS, shadcn/ui, Radix UI |
| バックエンド/DB | Supabase (PostgreSQL, Auth, RLS) |
| 国際化 | next-intl（33 言語） |
| AI 翻訳 | Groq / Cerebras / SiliconFlow / GitHub Models（フォールバック） |
| デプロイ | Vercel |

## セットアップ

### 前提条件

- Node.js
- [Supabase](https://supabase.com) プロジェクト
- [Vercel](https://vercel.com) アカウント（デプロイする場合）

### インストール

```bash
git clone <repository-url>
cd yubikiri
npm install
```

### 環境変数

`.env.local` を作成し、以下を設定してください。

```env
# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>

# AI 翻訳（任意 - いずれか1つ以上で翻訳機能が有効化）
GROQ_API_KEY=
CEREBRAS_API_KEY=
SILICONFLOW_API_KEY=
GITHUB_MODELS_API_KEY=

# Cron（Vercel デプロイ時に必要）
CRON_SECRET=<any-secret-string>
```

> Vercel を使う場合は `npx vercel env pull .env.local` で環境変数を同期できます。

### データベースマイグレーション

`supabase/migrations/` 配下の SQL ファイルを Supabase の SQL Editor で順番に実行してください。

### 起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で開発サーバーが起動します。

## プロジェクト構成

```
app/
├── page.tsx                    # ホームページ
├── auth/                       # 認証フロー（ログイン・サインアップ・パスワードリセット）
├── agreements/[id]/            # 合意書詳細（UUID で公開アクセス）
├── protected/                  # 認証必須ページ（ダッシュボード・合意書作成）
├── api/translate/              # AI 翻訳 API
├── api/cron/keep-alive/        # Supabase スリープ防止 Cron
└── actions/agreements.ts       # Server Actions
components/                     # UI コンポーネント
lib/                            # ユーティリティ（Supabase クライアント・翻訳・解析）
messages/                       # 33 言語の翻訳ファイル
supabase/migrations/            # DB マイグレーション
types/                          # TypeScript 型定義
```

## データベース構造

### agreements（合意書）

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | URL に使用 |
| `title` | text | 合意書タイトル |
| `content` | text | 合意書本文 |
| `status` | text | pending / accepted / rejected / revoked / withdraw_pending / revoke_pending |
| `content_hash` | text | SHA-256 改ざん検知ハッシュ |
| `creator_id` | UUID (FK) | 作成者の Auth ID |
| `creator_email` | text | 作成者メール |
| `target_email` | text? | 対象者メール（任意） |
| `original_locale` | text | 作成時の言語 |

### agreement_logs（操作ログ・証拠）

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | - |
| `agreement_id` | UUID (FK) | 対象の合意書 |
| `action_type` | text | accept / reject / revoke / rerequest / edit など |
| `recorded_at` | timestamptz | サーバー時刻 |
| `user_agent` | text | ブラウザ・OS 情報 |
| `actor_id` | UUID (FK) | 操作者の Auth ID |
| `actor_email` | text | 操作者メール |
| `ip_address` | text | IP アドレス |
| `ip_country` | text | 国コード |
| `ip_region` | text | 地域情報 |

## セキュリティ

- **RLS（行レベルセキュリティ）** - PostgreSQL レベルでのアクセス制御
- **UUID ベースのアクセス** - URL を知っている人だけが閲覧可能
- **不変の操作ログ** - INSERT のみ許可、UPDATE / DELETE 禁止
- **コンテンツハッシュ** - SHA-256 による改ざん検知
- **サーバー側タイムスタンプ** - クライアント改ざん防止

## デプロイ

```bash
npx vercel          # プレビューデプロイ
npx vercel --prod   # 本番デプロイ
```

## ライセンス

Private
