"use client";
import liff from "@line/liff";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

/**
 * サーバー (/api/login) に accessToken を送信して
 * sessionToken/refreshToken を受け取り、Supabaseクライアントにセット
 */
export const loginSupabase = async (): Promise<void> => {
  const lineAccessToken = liff.getAccessToken();
  console.log("[DEBUG] LINE Access Token 取得:", lineAccessToken ? "成功" : "失敗");
  console.log("[DEBUG] Token サンプル:", lineAccessToken ? lineAccessToken.substring(0, 10) + "..." : "none");
  
  if (!lineAccessToken) {
    throw new Error("No LINE access token");
  }
  
  // /api/login へリクエスト
  console.log("[DEBUG] /api/login へリクエスト送信");
  const resp = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: lineAccessToken }),
  });
  
  if (!resp.ok) {
    const e = await resp.json();
    throw new Error(`Server login failed: ${e.error?.message || e.error || "Unknown"}`);
  }
  
  const { sessionToken, refreshToken } = await resp.json();
  console.log("[DEBUG] サーバーレスポンス正常: トークン取得成功");
  
  // session をセット
  await supabase.auth.setSession({
    access_token: sessionToken,
    refresh_token: refreshToken,
  });
};
