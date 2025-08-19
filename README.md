# Ticket App User
こちらは、ユーザーがLINEから、〇〇、〇〇、〇〇するためのアプリである。

## 開発環境のセットアップ

1. supabase

### デバッグ手順

1. ローカルサーバーの起動
```bash
npm run dev
```

2. ngrokを使用してローカルサーバーを公開
```bash
ngrok http 3000
```

3. LINE Developers設定の更新
- ngrokで取得したURLを以下の2箇所に設定してください：
  - [LIFF URL](https://developers.line.biz/console/channel/2007075154/liff/2007075154-MeVpnkjl)
  - [LINE Login コールバックURL](https://developers.line.biz/console/channel/2007075154/line-login)

※ 注意: デバッグ時は必ず上記の設定を更新してください。設定を忘れるとLINE関連の機能が正常に動作しません。

## 機能一覧（ざっくり）

- **LINEログイン（LIFF）**: LIFFでログインし、取得したアクセストークンを用いて `/api/login` で検証・サインイン
- **トークン検証とプロフィール取得**: LINEのVerify/Profile APIで `client_id` と有効期限を検証し、プロフィールを取得
- **Supabaseユーザー作成/サインイン**: Service Roleで `admin.createUser`、その後 `signInWithPassword` でセッション発行
- **アプリ内ユーザー保存**: Drizzleで `users` / `user_auths` にLINEプロフィールを紐づけてUpsert
- **セッション維持**: ミドルウェアでSupabaseセッションを更新し、認証状態を維持
- **招待コード入力フロー**: `/input-code` でコードを入力し、以下を自動処理
  - **オペレーター招待**: 組織に `operator` として参加（既存なら再有効化）
  - **ゲスト招待**: 配布割当（allocation）に基づき、チケット枚数を付与
- **イベント別オペレーター画面**: `guest/invite/[eventId]` で「ID検索」「コード発行」タブを提供

### 主な関連ファイル

- `src/app/api/login/route.ts`: LINEトークン検証→プロファイル取得→Supabaseユーザー作成/サインイン→JSON返却
- `src/utils/auth/liff/liff.ts`: LIFF初期化とログイン誘導
- `src/utils/supabase/{client,server}.ts`: Supabaseクライアント（ブラウザ/サーバー）
- `src/middleware.ts`: セッション更新ミドルウェア
- `src/actions/invitationCode.ts`: 招待コードの検証・生成、オペレーター/ゲスト処理

## 準備するもの

- **LINE Developersアカウント**
  - チャネル（LINE Login/LIFF）を作成し、以下を取得/設定
    - **LIFF ID**（`.env: NEXT_PUBLIC_LIFF_ID`）
    - **チャネルID**（`.env: LINE_CHANNEL_ID`）
  - デバッグ時は、ngrokで公開したURLを
    - LIFFのエンドポイントURL
    - LINE LoginのコールバックURL
    に設定

- **Supabaseプロジェクト**
  - **Project URL**（`.env: NEXT_PUBLIC_SUPABASE_URL`）
  - **Anon Key**（`.env: NEXT_PUBLIC_SUPABASE_ANON_KEY`）
  - **Service Role Key**（`.env: SUPABASE_SERVICE_ROLE`）
  - **Postgres接続文字列**（`.env: DATABASE_URL`）
    - Supabaseの「Connection pooling（pgbouncer）」の接続文字列推奨

- **ngrok**（デバッグ用）
- **Node.js**（推奨: v18+）

## 環境変数（`.env`）

以下を `.env` に設定してください（値は各コンソールから取得）：

```env
NEXT_PUBLIC_LIFF_ID=
SUPABASE_SERVICE_ROLE=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
LINE_CHANNEL_ID=
```

補足:
- `SUPABASE_SERVICE_ROLE` は `/api/login` のユーザー作成で使用します（厳重に管理してください）。
- `DATABASE_URL` は Drizzle が直接DBへ接続するために使用します。

## セットアップ（簡易）

1. 依存関係のインストール
   ```bash
   npm i
   ```
2. 環境変数を設定
   ```bash
   cp .env.sample .env
   # 各値を埋める（上記「環境変数」を参照）
   ```
3. DBスキーマの適用（必要に応じて）
   - `migrations/` のSQLをSupabaseのSQLエディタで適用するか、Drizzleの運用フローに合わせて反映
4. ローカル起動
   ```bash
   npm run dev
   ```
5. ngrokで公開してLINE Developersの設定を更新
   ```bash
   ngrok http 3000
   ```
   - 生成されたURLをLIFFとLINE Loginコールバックに設定

