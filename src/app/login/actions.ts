'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('ログイン試行:', { email: data.email })

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  console.log('認証結果:', { 
    success: !error,
    error: error ? { message: error.message, code: error.code } : null,
    user: authData?.user ? { id: authData.user.id, email: authData.user.email } : null
  })

  if (error) {
    console.error('ログインエラー:', error.message)
    // エラーの詳細情報をクエリパラメータとして渡す
    redirect(`/error?message=${encodeURIComponent(error.message)}&code=${encodeURIComponent(error.code || 'unknown')}`)
  }

  console.log('ログイン成功、リダイレクト実行')
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('アカウント登録試行:', { email: data.email })

  const { data: authData, error } = await supabase.auth.signUp(data)

  console.log('登録結果:', { 
    success: !error, 
    error: error ? { message: error.message, code: error.code } : null,
    user: authData?.user ? { id: authData.user.id, email: authData.user.email } : null
  })

  if (error) {
    console.error('登録エラー:', error.message)
    // エラーの詳細情報をクエリパラメータとして渡す
    redirect(`/error?message=${encodeURIComponent(error.message)}&code=${encodeURIComponent(error.code || 'unknown')}`)
  }

  console.log('登録成功、リダイレクト実行')
  revalidatePath('/', 'layout')
  redirect('/')
}