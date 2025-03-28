"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import { Loader } from 'lucide-react';



// LINEプロフィールの型定義
interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// According to this document, https://developers.line.biz/en/docs/liff/opening-liff-app/#redirect-flow, liff.init() should be called in `/`
// This page is only used for liff login.
// setupLiff redirects after liff.init() is called to purpose of path.
export default function LiffInitPage() {
  const [status, setStatus] = useState<string>("初期化中...");
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<LineProfile | null>(null);


  useEffect(() => {
    // LIFFの初期化とログイン処理
    const initLiff = async () => {
      try {
        console.log("LIFF初期化開始");
        
        // LIFF IDの確認
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error("LIFF IDが設定されていません");
        }
        
        // LIFF初期化
        await liff.init({ liffId });
        console.log("LIFF初期化完了");
        
        // ログイン状態の確認
        if (!liff.isLoggedIn()) {
          console.log("LINEログインが必要です - ログイン処理を開始します");
          setStatus("LINEでログインします...");
          
          // リダイレクトURIを現在のページに設定（初期化用ページに戻る）
          const redirectUri = window.location.href;
          liff.login({ redirectUri });
          return; // ログイン処理後はここで終了（リダイレクトが発生するため）
        }
        
        // ログイン済みならユーザー情報取得
        console.log("ログイン済み - ユーザー情報を取得します");
        // この部分でアクセストークンをログ出力して確認
        const token = liff.getAccessToken();
        console.log("LINE Access Token:", token ? "取得成功" : "取得失敗", token && token.substring(0, 10) + "...");
        
        const profile = await liff.getProfile();
        console.log("LINEユーザー情報:", profile);
        setUserProfile(profile);
        setStatus(`${profile.displayName}さんとして認証完了`);
        
        // ホームページへリダイレクト（認証完了後）
        setTimeout(() => {
          console.log("ホームページへリダイレクト");
          window.location.href = "/home";
        }, 1000);
      } catch (error) {
        if (error instanceof Error && error.message === "The access token revoked") {
          // アクセストークンが無効の場合、キャッシュをクリアして再ログインを促す
          liff.logout();
          liff.login({ redirectUri: window.location.href });
        } else {
          // その他のエラー処理
          setStatus("エラーが発生しました");
          setError(error instanceof Error ? error.message : String(error));
        }
      }
    };
    
    initLiff();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="mt-4 text-base font-bold">
          Loading...
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            エラー: {error}
          </p>
        )}
      </div>
    </div>
  );
}
