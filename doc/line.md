以下に、**「招待リンクを踏むだけでLINE認証込みでコードを適用する」**ためのサンプル構成とコード例を示します。  
「現行のLIFFを使ったログイン」も引き続き利用しながら、「ブラウザからのアクセスでもLINEログインを誘導してコードを適用できる」ようにします。

---

## 全体像

1. **招待コード付きURL**  
   例: `https://example.com/invitation/[code]`  
   - 運営からこのURLを招待先ユーザーに送る。  
   - `[code]` は `invitation_codes.code` に対応するユニーク文字列。

2. **`(public)/invitation/[code]/page.tsx`** でのフロー  
   - **(A)** ユーザーがこのURLを踏む  
   - **(B)** サーバーサイド(or クライアントサイド)で「LINEログイン済みかどうか」チェック  
     - ログイン済みでなければ → LINE Web ログイン or LIFF login へリダイレクト  
     - ログイン済みであれば → すぐに招待コードを `redeemInvitationCode()` へ渡し、ロール/チケット発行などを行う  
   - **(C)** コードを消費したら、成功 or エラー を画面表示。  
     - 成功なら「〇〇の組織にoperator登録されました」など表示し、次のページへ誘導。

3. **LIFF/LINE Web Login 共存**  
   - LIFF環境（LINEアプリ内）であれば、`liff.init()` → `liff.isLoggedIn() ? redeemCode : liff.login()` の流れを継続。  
   - ブラウザの場合は、[LINE Loginチャネル](https://developers.line.biz/ja/services/line-login/) の「Web OAuth 2.1」設定を使ってログイン→コールバック→サーバーで Supabase セッション生成 のように実装します。  
   - いずれにせよ最終的には Supabase セッションを確立して、`redeemInvitationCode()` に到達する。

4. **LINE Developers 側の設定**  
   - すでにLIFFチャネルがある場合、加えて「Loginチャネル（Web用）」も必要になります。  
   - もし「LIFFチャネル」単独でのWebログインを使いたい場合は、LIFF v2 でも「外部ブラウザ対応」を可能にする設定がありますが、一般的には “LINE Loginチャネル” でWebログインを実装するケースが多いです。  
   - Callback URL に `https://example.com/api/line/callback` などを登録。

---

## ディレクトリ構成（概念図）

```
app
├─ (public)
│   ├─ login
│   │   ├─ page.tsx         // 既存の「LIFFログインリダイレクトページ」
│   │   └─ layout.tsx
│   └─ invitation
│       └─ [code]
│           └─ page.tsx     // 追加: 招待リンク用のエントリページ
├─ (authrized)
│   ├─ ... (既存のアプリ保護コンテンツ)
├─ api
│   ├─ line-callback
│   │   └─ route.ts         // 追加: Web用LINE OAuthコールバック(サンプル)
│   └─ login
│       ├─ route.ts         // 既存: LIFFからの認証API (POST)
│       └─ supabase.ts
├─ actions
│   ├─ invitationCode.ts    // 既存: redeemInvitationCodeなど
│   └─ user.ts
└─ middleware.ts
```

- **`(public)/invitation/[code]/page.tsx`**:  
  - 「ユーザーがURLアクセス → ログインチェック → 認証なければLINEログインへ → 成功後に`redeemInvitationCode()` → 結果表示」

- **`api/line-callback/route.ts`** (オプション):  
  - ブラウザ用の「LINE OAuth2.1」コールバックを受け取って、サーバー側で`access_token`を検証し、Supabaseのセッションを生成するなど。  
  - → 成功後 `/invitation/[code]` にリダイレクトし、再度`redeemInvitationCode()`を実行。

---

## コード例

### 1. `(public)/invitation/[code]/page.tsx`

```tsx
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loginViaLineWeb } from "@/utils/auth/lineWebLogin";
import { handleRedeemCode } from "./actions"; 
// ↑ handleRedeemCode は server action or fetch API で redeemInvitationCode() を呼び出す
// import { setupLiff } from "@/utils/auth/liff/liff"; // 既存の LIFF初期化

export default function InvitationCodePage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = params.code;

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 1. まずSupabaseのセッション(=ログイン状態)をチェック
    checkSessionAndRedeem();
  }, [codeParam]);

  async function checkSessionAndRedeem() {
    try {
      setIsProcessing(true);
      setError(null);

      // (A) Supabase経由で `session` or `user` を取得
      const resp = await fetch("/api/login/check", { method: "GET" });
      // これは「サーバーで supabase.auth.getUser() して返すだけの簡易API」など
      // 例: if (!session) { return { loggedIn: false } } else { ... }
      if (!resp.ok) {
        throw new Error("Login check failed");
      }
      const data = await resp.json();
      if (!data.loggedIn) {
        // (B) 未ログインなら LINE Web Login or LIFF login へ誘導
        // 例: loginViaLineWeb() は 次のセクションに示すサンプル
        await loginViaLineWeb({
          redirectTo: `/invitation/${codeParam}`, 
        });
        return;
      }

      // (C) ログイン済みなら -> コードをredeem
      await doRedeem();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError("予期せぬエラー");
      setIsProcessing(false);
    }
  }

  async function doRedeem() {
    try {
      // server action or route経由で redeemInvitationCode()
      const result = await handleRedeemCode(codeParam);
      if (!result.success) {
        throw new Error(result.error?.message || "招待コードエラー");
      }
      // 招待完了 → 成功ページへ or ここで表示
      router.push(`/invitation/${codeParam}/success?orgId=${result.data.organizationId}`);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError("予期せぬエラー");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      {isProcessing ? (
        <p>読み込み中...</p>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <p className="text-gray-600">招待コードを適用しています...</p>
      )}
    </div>
  );
}
```

- **ポイント**  
  - `loginViaLineWeb()` は「未ログインのときにLINE Web Loginへリダイレクトする」ためのヘルパー関数 (後述)  
  - ログインが成功すれば `/invitation/[code]` に戻ってくる → `checkSessionAndRedeem()` の `loggedIn` が true → `doRedeem()` 実行  
  - `doRedeem()` の最後に `router.push()` で「成功ページ」へ飛ばすなど  

### 2. `(public)/invitation/[code]/actions.ts` (Server Action例)

```tsx
"use server";

import { redeemInvitationCode } from "@/actions/invitationCode";
import { createClient } from "@/utils/supabase/server";

export async function handleRedeemCode(codeParam: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 正常にセッションがあればここには来ないはず
    return {
      success: false,
      error: { message: "ログインが必要です" },
    };
  }

  // user.id (Supabase UUID) → drizzle上の user.id(連番) を取得
  // 既存の `getUserAuthsBySupabaseId(user.id)` など
  const userAuthInfo = await fetchUserAuthInfo(user.id);
  if (!userAuthInfo.success) {
    return {
      success: false,
      error: userAuthInfo.error,
    };
  }

  const drizzleUserId = userAuthInfo.data.user_id; // drizzle内での `users.id`

  // drizzle actions
  const result = await redeemInvitationCode(drizzleUserId, codeParam);
  return result;
}

async function fetchUserAuthInfo(supabaseAuthId: string) {
  // ここは既存の `getUserAuthsBySupabaseId` でもOK
  // 例:
  const data = await fetch("/api/user-auths?id=" + supabaseAuthId).then((r) => r.json());
  return data; // { success, data, error... }
}
```

- Server Actionなので、`"use server"` で書いています。  
- `redeemInvitationCode()` はあなたの既存通り `actions/invitationCode.ts`。  
- この例では「Supabase UUID → Drizzle users.id」解決に内部APIや既存メソッドを呼んでいます。

### 3. Web用LINEログインヘルパー例 (`loginViaLineWeb`)

```tsx
// src/utils/auth/lineWebLogin.ts
export async function loginViaLineWeb({ redirectTo }: { redirectTo?: string }) {
  // ここでは単純に "LINE Login" 公式ドキュメントの認可URLに飛ばすイメージ
  // たとえば channelId & scope & state & redirectUri など
  const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID; // LINE LoginチャネルのChannel ID
  const state = redirectTo ? encodeURIComponent(redirectTo) : "/";
  const callbackUrl = `https://example.com/api/line-callback`;
  const scope = "openid profile"; // など必要に応じ

  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(
    callbackUrl
  )}&state=${state}&scope=${scope}`;

  window.location.href = authUrl;
}
```

- 実際には PKCE などを使うのが推奨です。公式ドキュメント参照。  
- `callbackUrl` には `api/line-callback/route.ts` とかを指定。  
- `state` に「招待コードページへの戻り先」を入れておく。

### 4. Web用LINE OAuthコールバック (オプション)

```ts
// src/app/api/line-callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifyLineToken } from "@/utils/auth/verifyLineToken"; // Access Token検証
import { upsertUser } from "@/actions/user"; // drizzleに upsert するなど

export async function GET(req: NextRequest) {
  // 1. Queryパラメータから code, state を取得
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "/";
  if (!code) {
    // エラー処理
    return NextResponse.redirect(`/?error=code_missing`);
  }

  // 2. LINE Access Token交換
  // 公式 docs: https://developers.line.biz/ja/docs/line-login/integrate-line-login/#making-an-access-token-request
  // 例:
  const lineTokenUrl = "https://api.line.me/oauth2/v2.1/token";
  // client_id, client_secret, redirect_uri は env or setting
  const client_id = process.env.LINE_LOGIN_CHANNEL_ID;
  const client_secret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  const redirect_uri = "https://example.com/api/line-callback";

  const tokenResp = await fetch(lineTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri,
      client_id: client_id!,
      client_secret: client_secret!,
    }),
  });

  if (!tokenResp.ok) {
    // エラー処理
    return NextResponse.redirect(`/?error=token_exchange_failed`);
  }

  const tokenData = await tokenResp.json(); // { access_token, id_token, expires_in, ... }
  const accessToken = tokenData.access_token as string;

  // 3. token 検証 & プロフィール取得
  // verifyLineToken()は、access_tokenを `https://api.line.me/oauth2/v2.1/verify` で確認するなど
  const profile = await getLineProfile(accessToken);
  if (!profile) {
    return NextResponse.redirect(`/?error=profile_fetch_failed`);
  }

  // 4. drizzleの users / user_auths に upsert
  //    (既存: upsertUser(lineId, displayName...) など)
  const drizzleUserId = await upsertUser(profile);

  // 5. Supabase側でも user 作成 or signInWithIdToken() など
  //    ここでは service role key で createServerClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { headers: {}, cookies });

  // 例: supabase.auth.admin.createUser(...) or signInWithIdToken() など → session cookie
  //  あるいは独自に /api/login/route.ts と同様に accessToken→sessionToken交換
  //   (ここはお好みの実装に合わせて)

  // 6. Redirect back to invitation page
  return NextResponse.redirect(`https://example.com${decodeURIComponent(state)}`);
}

async function getLineProfile(accessToken: string) {
  const resp = await fetch("https://api.line.me/v2/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!resp.ok) return null;
  return resp.json(); // { userId, displayName, pictureUrl... }
}
```

- 上記は簡易例です。  
- 受け取った `code` を LINE OAuth endpoint へ渡して `access_token` を取得し、プロフィール取得 → Drizzle へ upsert → Supabaseセッション確立 → 最後に `state` で指定していた元URLへリダイレクト。

### 5. 既存LIFFとの共存

- **LIFFアプリ内** から同じ `https://example.com/invitation/[code]` を踏むと、  
  - `window.liff` が有効であれば `liff.init() → isLoggedIn ? redeem : liff.login()`  
  - もしくは `useEffect` で `if (liff.isInClient()) {...}` のように分岐  
- **通常ブラウザ** なら `loginViaLineWeb()` で OAuth2.1  
- どちらのモードでも、最終的に `Supabase Session` を確立すれば同じ `redeemInvitationCode()` に到達できる。

### 6. ミドルウェア回避

- 既存の `middleware.ts` が「`(public)/` 下以外は認証必須」にしているなら、  
  - `/invitation` は `(public)` フォルダに置いておけば middleware に引っかからず自由にアクセスできる  
  - その中で必要なら任意に認証を実行(上記フロー)

---

## まとめ

- **最もスムーズ** にするには、「一度URLを踏むだけで、必要なら自動ログイン→コード適用→結果表示」を実装する。
- Next.js 13 + Supabase + LINEログイン(LIFF / Web) を併用する場合、**`(public)/invitation/[code]/page.tsx`** など“middlewareフリーなルート”で  
  1. セッション確認  
  2. 未ログインならLINEログインに誘導  
  3. ログイン後 → server actionで`redeemInvitationCode()`  
- **LINE Developers の設定**  
  - LIFFチャネル (→「LINEアプリ内ブラウザ」でのログイン)  
  - + Loginチャネル (→通常ブラウザからのLINE OAuth2.1用)  
  - Callback URL は `https://example.com/api/line-callback` 等を登録。

こうすることで「招待URLをクリック → LINE認証(必要に応じ) → コード適用」という流れが実現でき、  
LIFF環境・通常ブラウザの両方に対応した**最適な招待フロー**になります。