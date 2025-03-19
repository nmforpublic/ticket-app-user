import { createClient } from "@/utils/supabase/server";
import { getUserAuthsBySupabaseId } from "@/actions/user";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  console.log("data", data);
  console.log("error", error);

  const userData = await getUserAuthsBySupabaseId(data.user?.id as string);
  console.log("me", userData);


  return (
    <div>
      <h1>ようこそ、{userData.data?.profile?.display_name || userData.data?.provider_identifier || "名前なし"}さん！</h1>
      <p>プロバイダー: {userData.data?.provider}</p>
      <p>ユーザーID: {userData.data?.user_id}</p>
      <p>LINE ID: {userData.data?.provider_identifier}</p>
      <p>プロフィール画像: {userData.data?.profile?.picture_url && 
        <img src={userData.data.profile.picture_url} alt="プロフィール画像" width={100} height={100} />
      }</p>
      <p>ステータスメッセージ: {userData.data?.profile?.status_message || "なし"}</p>
      <p>作成日: {userData.data?.created_at?.toLocaleDateString()}</p>
      <p>更新日: {userData.data?.updated_at?.toLocaleDateString()}</p>
    </div>
  );
}
