# Yubikiri - デジタル同意書プラットフォーム

**「口約束の、その先へ」**

Yubikiri（ゆびきり）は、個人間の約束事をデータベースに証拠付きで記録する軽量なデジタル同意書システムです。PDFや紙の契約書ではなく、タイムスタンプ・IPアドレス・User Agentなどのメタデータとともに同意の事実を不変のログとして残します。

**本番URL:** https://yubikiri.vercel.app

---

## 目次

- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [アーキテクチャ概要](#アーキテクチャ概要)
- [データベース設計](#データベース設計)
- [暗号化（Encryption at Rest）](#暗号化encryption-at-rest)
- [認証](#認証)
- [国際化（i18n）](#国際化i18n)
- [AI翻訳](#ai翻訳)
- [同意書のワークフロー](#同意書のワークフロー)
- [セキュリティ](#セキュリティ)
- [プロジェクト構造](#プロジェクト構造)
- [セットアップ](#セットアップ)
- [環境変数](#環境変数)
- [デプロイ](#デプロイ)
- [ライセンス](#ライセンス)

---

## 主な機能

### 同意書の作成・共有
- Tiptapベースのリッチテキストエディタ（太字、イタリック、リンク、カラー、ハイライト対応）
- UUID付きの共有URL（`/agreements/[id]`）でリンクを知っている人がアクセス可能
- 特定のメールアドレスを対象者として指定可能（指定しない場合は誰でも合意可能）

### 同意書のアクション
- **合意（Accept）** — 対象者が同意書に合意
- **拒否（Reject）** — 対象者が同意書を拒否
- **再申請（Rerequest）** — 作成者が拒否された同意書を再申請
- **編集（Edit）** — 作成者が同意書を編集（ステータスはpendingにリセット）
- **取り下げ（Withdraw）** — 作成者が同意書を取り下げ
  - 誰も合意していない場合：即座に削除
  - 合意者がいる場合：相手の承認が必要（withdraw_pending → approve/reject）
- **解除（Revoke）** — 合意した側が合意を解除申請
  - 作成者の承認が必要（revoke_pending → approve/reject）

### 改ざん検知
- 同意書の内容からSHA-256ハッシュを生成し`content_hash`として保存
- 内容が変更された場合にハッシュの不一致で検出可能

### 包括的な操作ログ
- 全アクション（accept, reject, edit, withdraw, revokeなど）を`agreement_logs`テーブルにINSERT-onlyで記録
- 各ログにはタイムスタンプ、User Agent、IPアドレス、IP国・地域情報を含む
- ログはサーバーサイドタイムスタンプを使用（クライアント改ざん不可）
- CASCADEにより同意書削除時にログも削除

### AI翻訳
- 33言語に対応したAI翻訳機能
- 複数のAIプロバイダー（Groq, Cerebras, SiliconFlow, GitHub Models）にフォールバック対応
- 翻訳は同意書のタイトルと内容を一括で処理

### ダッシュボード
- 自分が作成した同意書と、自分が関与した同意書を一覧表示
- ステータスバッジによる視覚的な状態表示

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | [Next.js](https://nextjs.org/) 16 (App Router, Turbopack) |
| 言語 | TypeScript 5 |
| UI | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI) |
| アイコン | [Lucide React](https://lucide.dev/) |
| リッチテキスト | [Tiptap](https://tiptap.dev/) (StarterKit, Link, Color, Highlight, TextStyle) |
| 認証 | [Supabase Auth](https://supabase.com/auth) (Google, Discord, LINE OAuth) |
| データベース | [Supabase](https://supabase.com/) (PostgreSQL) + Row Level Security |
| 国際化 | [next-intl](https://next-intl.dev/) (33言語) |
| AI翻訳 | Groq / Cerebras / SiliconFlow / GitHub Models (フォールバック) |
| サニタイズ | [DOMPurify](https://github.com/cure53/DOMPurify) |
| デプロイ | [Vercel](https://vercel.com/) |

---

## アーキテクチャ概要

```
┌──────────────────────────────────────────────────────┐
│                    クライアント                        │
│  Next.js App Router (RSC + Client Components)        │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐    │
│  │ ダッシュ  │ │ 同意書   │ │ リッチテキスト     │    │
│  │ ボード   │ │ 詳細     │ │ エディタ (Tiptap) │    │
│  └──────────┘ └──────────┘ └───────────────────┘    │
└──────────────────┬───────────────────────────────────┘
                   │ Server Actions / API Routes
┌──────────────────▼───────────────────────────────────┐
│                   サーバーサイド                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Server       │ │ 暗号化/復号  │ │ AI翻訳       │ │
│  │ Actions      │ │ (AES-GCM)   │ │ API Route    │ │
│  └──────┬───────┘ └──────────────┘ └──────────────┘ │
│         │                                            │
│  ┌──────▼───────────────────────────────────────┐   │
│  │ Supabase Client (RLS適用)                     │   │
│  └──────┬───────────────────────────────────────┘   │
└─────────┼────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────┐
│                    Supabase                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ PostgreSQL   │ │ Auth         │ │ Edge         │ │
│  │ + RLS        │ │ (OAuth)      │ │ Functions    │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## データベース設計

### `agreements` テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| `id` | uuid (PK) | 自動生成、共有URLに使用 |
| `title` | text | タイトル（暗号化時は暗号文） |
| `content` | text | 内容（暗号化時は暗号文） |
| `status` | text | ステータス（下記参照） |
| `content_hash` | text | 平文のSHA-256ハッシュ |
| `creator_id` | uuid (FK) | 作成者のauth.users.id |
| `creator_email` | text | 作成者のメールアドレス |
| `target_email` | text? | 対象者のメールアドレス（nullで公開） |
| `previous_status` | text? | withdraw/revoke前のステータス保存用 |
| `original_locale` | text? | 作成時の言語コード |
| `title_iv` | text? | タイトル暗号化のIV (hex) |
| `content_iv` | text? | コンテンツ暗号化のIV (hex) |
| `is_encrypted` | boolean | 暗号化フラグ（デフォルト: false） |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時（トリガーで自動更新） |

**ステータス遷移:**

```
pending ──→ accepted ──→ revoke_pending ──→ revoked (削除)
   │              │                    └──→ accepted (拒否)
   │              └──→ withdraw_pending ──→ 削除 (承認)
   │                                   └──→ accepted (拒否)
   └──→ rejected ──→ pending (再申請)
   └──→ 削除 (取り下げ、合意者なし)
```

### `agreement_logs` テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| `id` | uuid (PK) | 自動生成 |
| `agreement_id` | uuid (FK) | 対象の同意書（CASCADE削除） |
| `action_type` | text | アクション種別（下記参照） |
| `recorded_at` | timestamptz | サーバーサイドタイムスタンプ |
| `user_agent` | text? | ブラウザのUser Agent |
| `actor_id` | uuid | 操作者のauth.users.id |
| `actor_email` | text? | 操作者のメールアドレス |
| `ip_address` | text? | IPアドレス |
| `ip_country` | text? | IP由来の国コード |
| `ip_region` | text? | IP由来の地域名 |

**アクション種別:** `accept`, `reject`, `revoke`, `rerequest`, `edit`, `withdraw_request`, `withdraw_approve`, `withdraw_reject`, `revoke_request`, `revoke_approve`, `revoke_reject`

### Row Level Security (RLS) ポリシー

| ポリシー | 条件 |
|---------|------|
| SELECT (agreements) | 作成者 OR 対象者 OR target_emailがNULL（公開） OR 過去にアクションを行ったユーザー |
| INSERT (agreements) | 認証済みユーザー（creator_id = auth.uid()） |
| UPDATE (agreements) | 認証済みユーザー |
| DELETE (agreements) | 作成者 OR 対象者 OR 過去にアクションを行ったユーザー |
| INSERT (agreement_logs) | actor_id = auth.uid() のみ |
| SELECT (agreement_logs) | 自分のログ OR 関連する同意書の当事者 |

### マイグレーション履歴

| ファイル | 内容 |
|---------|------|
| `001_create_agreements.sql` | agreementsとagreement_logsテーブル作成、RLSポリシー、トリガー |
| `002_add_rerequest.sql` | rerequest アクション種別追加 |
| `003_add_actor_email_and_edit.sql` | actor_emailカラム、editアクション種別追加 |
| `004_add_ip_address.sql` | IPアドレストラッキング追加 |
| `005_rename_ip_city_to_region.sql` | ip_city → ip_region リネーム |
| `006_withdraw_approval.sql` | 取り下げ承認ワークフロー追加 |
| `007_revoke_approval_and_fix_delete.sql` | 解除承認ワークフロー、CASCADE削除修正 |
| `008_add_original_locale.sql` | original_localeフィールド追加 |
| `009_tighten_rls_policies.sql` | RLSポリシー強化 |
| `010_add_encryption.sql` | 暗号化カラム（title_iv, content_iv, is_encrypted）追加 |

---

## 暗号化（Encryption at Rest）

DBの管理者が同意書の内容を直接読めないようにするため、サーバーサイドで透明な暗号化・復号を実装しています。

### 仕組み

```
作成時:
  平文 title/content
    ↓ content_hash = SHA-256(平文) ← 平文から計算
    ↓ UEK = PBKDF2(userId + email, APP_ENCRYPTION_SECRET)
    ↓ AES-GCM暗号化（ランダムIV生成）
  暗号文 title/content + title_iv/content_iv → DB保存

読み取り時:
  DB → 暗号文 title/content + IVs
    ↓ creator_id + creator_email から UEK を再導出
    ↓ AES-GCM復号
  平文 title/content → クライアントに返却
```

### 暗号方式の詳細

| 項目 | 仕様 |
|------|------|
| 鍵導出 | PBKDF2 (100,000 iterations, SHA-256) |
| 鍵素材 | `userId + email`（ユーザー固有） |
| ソルト | `APP_ENCRYPTION_SECRET`（環境変数） |
| 暗号化方式 | AES-GCM 256bit |
| IV | 96bit ランダム生成（各暗号化ごとに異なる） |
| 暗号文形式 | Base64エンコード |
| IV保存形式 | 16進数（hex）文字列 |

### User Encryption Key (UEK)

```
UEK = PBKDF2(
  password: userId + email,    // ユーザー固有
  salt: APP_ENCRYPTION_SECRET, // 環境変数
  iterations: 100,000,
  hash: SHA-256,
  keyLength: 256bit
) → AES-GCM CryptoKey
```

- サーバーがユーザーのID+emailから鍵を導出するため、`key_grants`テーブルは不要
- 共有時も、作成者の`creator_id` + `creator_email`からUEKを再導出して復号
- `APP_ENCRYPTION_SECRET`なしではDB単体からの復号は不可能

### 既存データとの互換性

- `is_encrypted = false`（デフォルト）のレコードは平文としてそのまま読み取り
- 新規作成は`is_encrypted = true`で暗号化保存
- 既存同意書を編集すると自動的に暗号化される

### 関連ファイル

- `lib/encryption.ts` — 暗号化ユーティリティ（deriveUserKey, encrypt, decrypt, encryptAgreement, decryptAgreement）
- `app/actions/agreements.ts` — createAgreement/editAgreementで暗号化
- `app/agreements/[id]/page.tsx` — 詳細ページで復号
- `app/protected/page.tsx` — ダッシュボード一覧で復号

---

## 認証

Supabase Authを使用したOAuth認証に対応しています。メールアドレスによるサインアップは無効化されています。

### 対応プロバイダー

| プロバイダー | 必要な環境変数 |
|------------|---------------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Discord | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` |
| LINE | `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` |

### 認証フロー

1. ユーザーがログインボタンをクリック
2. Supabase Authが各プロバイダーのOAuth画面にリダイレクト
3. 認可後、`/auth/callback`にリダイレクトされコード交換
4. セッションが確立され、ダッシュボード（`/protected`）にリダイレクト

### LINE OAuth

LINEは標準的なOAuthフローとは異なるため、専用のコールバックハンドラー（`/auth/callback/line`）を使用しています。`NEXT_PUBLIC_LINE_CHANNEL_ID`でクライアントサイドからチャネルIDを参照します。

---

## 国際化（i18n）

[next-intl](https://next-intl.dev/)を使用し、33言語に対応しています。

### 対応言語

日本語 (ja, デフォルト), English (en), 中文简体 (zh), 中文繁體 (zh-TW), 한국어 (ko), Español (es), Français (fr), Deutsch (de), Italiano (it), Português (pt), Русский (ru), العربية (ar), हिन्दी (hi), ไทย (th), Tiếng Việt (vi), Bahasa Indonesia (id), Bahasa Melayu (ms), Türkçe (tr), Polski (pl), Nederlands (nl), Svenska (sv), Dansk (da), Suomi (fi), Norsk (no), Українська (uk), Čeština (cs), Română (ro), Magyar (hu), Ελληνικά (el), עברית (he), বাংলা (bn), தமிழ் (ta)

### 仕組み

- `messages/`ディレクトリに各言語のJSONファイルを配置
- Cookieベースのロケール検出（`locale` Cookie）
- クライアントサイドで`IntlProvider`を通じて翻訳を提供
- ロケール切り替えは即座に反映

### 翻訳キー構造

```json
{
  "common": { "appName": "ゆびきり", ... },
  "home": { "title": "...", "description": "...", ... },
  "dashboard": { "title": "...", ... },
  "agreement": { "title": "...", "content": "...", ... },
  "status": { "pending": "...", "accepted": "...", ... },
  "action": { "accept": "...", "reject": "...", ... },
  "actionLog": { "accept": "...", ... },
  "auth": { "login": "...", ... },
  "errors": { "notFound": "...", ... },
  "localeNames": { "ja": "日本語", "en": "English", ... }
}
```

---

## AI翻訳

同意書のタイトルと内容を33言語間で翻訳する機能を提供しています。

### プロバイダーフォールバック

複数のAIプロバイダーを順番に試行し、1つが失敗しても次のプロバイダーにフォールバックします。

| 優先度 | プロバイダー | 環境変数 |
|-------|------------|---------|
| 1 | Groq | `GROQ_API_KEY` |
| 2 | Cerebras | `CEREBRAS_API_KEY` |
| 3 | SiliconFlow | `SILICONFLOW_API_KEY` |
| 4 | GitHub Models | `GITHUB_MODELS_API_KEY` |

### エンドポイント

`POST /api/translate` — クライアントから平文のタイトル・内容・ターゲット言語を受け取り、翻訳結果を返します。暗号化はServer Actionsで行われるため、翻訳APIは平文を扱います。

---

## 同意書のワークフロー

### 作成から合意まで

```
1. 作成者がリッチテキストエディタで同意書を作成
2. Server Actionでcontent_hashを計算 → 暗号化 → DB保存
3. 共有URL (/agreements/[uuid]) を相手に送信
4. 相手がURLを開く → サーバーで復号 → 平文を表示
5. 相手が「合意する」をクリック → ログ記録 → ステータス更新
```

### 取り下げワークフロー

```
合意者がいない場合:
  作成者が取り下げ → 即座に削除

合意者がいる場合:
  作成者が取り下げ申請 → status: withdraw_pending
    → 合意者が承認 → 削除
    → 合意者が拒否 → 元のステータスに復帰
```

### 解除ワークフロー

```
合意者が解除申請 → status: revoke_pending
  → 作成者が承認 → 削除
  → 作成者が拒否 → 元のステータスに復帰
```

---

## セキュリティ

| 機能 | 説明 |
|------|------|
| Row Level Security | PostgreSQLのRLSにより、認可されたユーザーのみデータにアクセス可能 |
| UUIDベースのURL | 推測困難なUUIDで同意書にアクセス（知識ベースのアクセス制御） |
| 不変の操作ログ | INSERT-onlyの`agreement_logs`テーブル。UPDATE/DELETEは不可 |
| コンテンツハッシュ | SHA-256による改ざん検知 |
| サーバーサイドタイムスタンプ | `recorded_at`はDB側の`now()`で記録（クライアント改ざん不可） |
| Encryption at Rest | AES-GCM 256bitによるタイトル・コンテンツの暗号化 |
| ユーザー固有の暗号鍵 | PBKDF2でユーザーごとに異なる暗号鍵を導出 |
| OAuth認証 | メールパスワード認証は無効化、OAuth2のみ対応 |
| HTMLサニタイズ | DOMPurifyによるXSS防止 |
| IPジオロケーション | 操作時のIPアドレス・国・地域を記録 |

---

## プロジェクト構造

```
yubikiri/
├── app/
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # ホームページ（公開）
│   ├── actions/
│   │   └── agreements.ts       # Server Actions（CRUD + ワークフロー）
│   ├── agreements/
│   │   └── [id]/
│   │       └── page.tsx        # 同意書詳細ページ（公開）
│   ├── api/
│   │   ├── translate/
│   │   │   └── route.ts        # AI翻訳エンドポイント
│   │   └── cron/
│   │       └── keep-alive/
│   │           └── route.ts    # DB keep-alive cronジョブ
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx        # ログインページ
│   │   ├── callback/
│   │   │   └── route.ts        # OAuthコールバック
│   │   └── error/
│   │       └── page.tsx        # エラーページ
│   └── protected/
│       ├── page.tsx            # ダッシュボード（要認証）
│       └── agreements/
│           └── new/
│               └── page.tsx    # 同意書作成ページ
├── components/
│   ├── agreement-card.tsx      # 同意書カード（一覧用）
│   ├── agreement-detail.tsx    # 同意書詳細表示
│   ├── agreement-form.tsx      # 同意書作成フォーム
│   ├── agreement-edit-form.tsx # 同意書編集フォーム
│   ├── agreement-status-badge.tsx
│   ├── auth-button.tsx         # 認証ボタン
│   ├── locale-switcher.tsx     # 言語切替
│   ├── theme-switcher.tsx      # テーマ切替
│   ├── tiptap-editor.tsx       # リッチテキストエディタ
│   ├── intl-provider.tsx       # 国際化プロバイダー
│   └── ui/                    # shadcn/ui コンポーネント
├── lib/
│   ├── agreements.ts           # 型変換・ハッシュ生成ユーティリティ
│   ├── encryption.ts           # AES-GCM暗号化/復号ユーティリティ
│   ├── translate.ts            # AI翻訳（マルチプロバイダー）
│   ├── request-info.ts         # リクエスト情報（IP, UA, Geo）取得
│   ├── sanitize.ts             # HTMLサニタイズ
│   └── supabase/
│       ├── client.ts           # ブラウザ用Supabaseクライアント
│       ├── server.ts           # サーバー用Supabaseクライアント
│       ├── admin.ts            # Service Role用クライアント
│       └── proxy.ts            # ミドルウェア用
├── types/
│   └── database.ts             # DB Row型 + アプリケーション型
├── i18n/
│   └── config.ts               # ロケール設定
├── messages/                   # 33言語の翻訳JSONファイル
├── supabase/
│   ├── config.toml             # Supabase設定（認証プロバイダー等）
│   └── migrations/             # DBマイグレーション（001〜010）
├── middleware.ts               # セッション更新ミドルウェア
├── .env.local                  # 環境変数（gitignore済み）
└── package.json
```

---

## セットアップ

### 前提条件

- Node.js 18以上
- npm
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Supabaseプロジェクト

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/hiroryngit/Yubikiri.git
cd Yubikiri

# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集して各値を設定
```

### データベースセットアップ

```bash
# Supabase CLIでログイン
npx supabase login

# マイグレーションを適用
npx supabase db push

# Supabase設定を反映（認証プロバイダー等）
npx supabase config push
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

---

## 環境変数

### 必須

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase公開キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Roleキー |
| `APP_ENCRYPTION_SECRET` | 暗号化用シークレット（256bit hex文字列） |
| `NEXT_PUBLIC_SITE_URL` | 本番サイトのURL |
| `CRON_SECRET` | Cronジョブの認証シークレット |

### OAuth（少なくとも1つのプロバイダーが必要）

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット |
| `DISCORD_CLIENT_ID` | Discord OAuth クライアントID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth クライアントシークレット |
| `LINE_CHANNEL_ID` | LINE Login チャネルID |
| `LINE_CHANNEL_SECRET` | LINE Login チャネルシークレット |
| `NEXT_PUBLIC_LINE_CHANNEL_ID` | LINE チャネルID（クライアントサイド用） |

### AI翻訳（任意、フォールバック対応）

| 変数名 | 説明 |
|--------|------|
| `GROQ_API_KEY` | Groq APIキー |
| `CEREBRAS_API_KEY` | Cerebras APIキー |
| `SILICONFLOW_API_KEY` | SiliconFlow APIキー |
| `GITHUB_MODELS_API_KEY` | GitHub Models APIキー |

### APP_ENCRYPTION_SECRETの生成

```bash
openssl rand -hex 32
```

---

## デプロイ

### Vercel

1. GitHubリポジトリをVercelに接続
2. 環境変数をVercelダッシュボードまたはCLIで設定
3. プッシュで自動デプロイ

```bash
# Vercel CLIで環境変数を追加する例
echo "YOUR_SECRET" | npx vercel env add APP_ENCRYPTION_SECRET production
```

### Supabase

```bash
# マイグレーション適用
npx supabase db push

# 設定反映（認証プロバイダー等）
npx supabase config push
```

---

## ライセンス

Private
