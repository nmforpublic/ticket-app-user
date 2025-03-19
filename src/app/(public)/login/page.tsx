"use client";

import { useEffect, useState } from "react";
import { setupLiff } from "@/utils/auth/liff/liff";
import { loginSupabase } from "@/utils/auth/supabase";

export default function LoginRedirect() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const doLogin = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get("redirectTo") || "/home";

        // 1. LINE LIFF初期化
        await setupLiff(redirectTo);
        // 2. Supabaseログイン (サーバーにアクセストークン渡す)
        await loginSupabase();

        // 3. ログイン完了後にリダイレクト
        window.location.href = redirectTo;
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("Unknown error occurred");
      }
    };
    doLogin();
  }, []);

  if (error) {
    return <div>エラーが発生: {error}</div>;
  }
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="mt-4 text-base font-bold">
          ログイン中...
        </p>
      </div>
    </div>
  )
}
