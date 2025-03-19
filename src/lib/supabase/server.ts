import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  console.log('サーバークライアント作成')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          console.log('取得したCookie数:', allCookies.length)
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            console.log('サーバーからCookieを設定:', cookiesToSet.map(c => c.name).join(', '))
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.error('Cookieの設定中にエラーが発生:', error)
          }
        },
      },
    }
  )
}