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

  const searchParams = new URLSearchParams()
  if (result.data?.organizationId) {
    searchParams.set('organizationId', result.data.organizationId.toString())
  }
  if (result.data?.organizationName) {
    searchParams.set('organizationName', result.data.organizationName)
  }

  redirect(`/input-code/success?${searchParams.toString()}`)
} 