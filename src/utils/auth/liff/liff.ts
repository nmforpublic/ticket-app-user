"use client";
import liff from "@line/liff";
// モック関連のインポートを削除
// import { LiffMockPlugin } from "@line/liff-mock";
// import type { MockData } from "@line/liff-mock/dist/store/MockDataStore";
// import { getMockProfile, getMockScanCodeResult } from "./liff_mock";

// const TEST_USER_ID = "U0000001";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID as string;

if (!LIFF_ID) {
  throw new Error("LIFF_ID is not set");
}

// モック設定関数を削除
// const setupMockLiff = async () => { ... };

export async function setupLiff(redirectTo: string) {
  // 環境チェックを削除し、常に実際のLIFFを使用
  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    const redirectUri = new URL(redirectTo, window.location.origin).href;
    liff.login({ redirectUri });
  }
}
