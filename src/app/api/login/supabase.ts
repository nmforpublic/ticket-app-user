// src/app/api/login/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/** 
 * Supabase Service Role Keyでクライアントを初期化 
 * (db操作はDrizzleでやるが、認証周りのadmin.createUser等はSupabase SDKで)
 */
export async function initializeBackendSupabase(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase URL or Service Role Key is missing");
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // 接続テスト (任意)
  const { error } = await supabase.from("users").select("*", { head: true, count: "exact" });
  if (error) {
    throw new Error(`[initializeBackendSupabase] Service Role connection failed: ${error.message}`);
  }
  return supabase;
}
