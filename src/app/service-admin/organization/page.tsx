import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrganizationClient from './client-side'


export default async function Organization() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user || data.user.email !== process.env.NEXT_PUBLIC_SERVICE_ADMIN_USER_EMAIL) {
    redirect('/login')
  }
    return (
        <OrganizationClient />
    )
}
