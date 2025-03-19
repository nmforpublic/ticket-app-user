import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminUserClient from './client-side'


export default async function AdminUser() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user || data.user.email !== process.env.NEXT_PUBLIC_SERVICE_ADMIN_USER_EMAIL) {
    redirect('/login')
  }
    return (
        <AdminUserClient />
    )
}
