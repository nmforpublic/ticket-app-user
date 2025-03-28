'use server'

import { createClient } from "@/utils/supabase/server"
import { getUserAuthsBySupabaseId } from "@/actions/user"
import { redeemInvitationCode } from "@/actions/invitationCode"
import { redirect } from "next/navigation"

export async function handleSubmit(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("認証エラーが発生しました")
  }

  const userData = await getUserAuthsBySupabaseId(user.id)
  if (!userData || userData.error || !userData.data) {
    throw new Error("ユーザー情報が見つかりません")
  }

  console.log("userData", userData)

  const code = formData.get('code') as string
  const result = await redeemInvitationCode(userData.data.user_id, code)

  if (result.error) {
    throw new Error(result.error.message)
  }

  if (!result.data) {
    throw new Error("コード処理の結果が不明です")
  }

  const searchParams = new URLSearchParams()
  
  // オペレーター招待の場合
  if ('organizationId' in result.data) {
    if (result.data.organizationId) {
      searchParams.set('organizationId', result.data.organizationId.toString())
    }
    if (result.data.organizationName) {
      searchParams.set('organizationName', result.data.organizationName)
    }
    redirect(`/input-code/operator-success?${searchParams.toString()}`)
  } 
  // ゲスト招待の場合
  else if ('allocationId' in result.data) {
    searchParams.set('allocationId', result.data.allocationId.toString())
    searchParams.set('eventId', result.data.eventId.toString())
    searchParams.set('ticketCount', result.data.ticketCount.toString())
    redirect(`/input-code/guest-success?${searchParams.toString()}`)
  }
  
  // デフォルト（どちらにも当てはまらない場合）
  redirect(`/input-code/success?${searchParams.toString()}`)
} 