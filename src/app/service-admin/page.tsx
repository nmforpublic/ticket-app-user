import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const cardsList = [
    { id: 1, title: "組織作成", link: "service-admin/organization" },
    { id: 2, title: "Adminユーザー登録", link: "service-admin/admin-user" },
  ]

export default async function ServiceAdmin() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user || data.user.email !== process.env.NEXT_PUBLIC_SERVICE_ADMIN_USER_EMAIL) {
    redirect('/login')
  }
    return (
        <div className="container mx-auto px-4 py-8 h-screen overflow-auto">
        <h1 className="text-lg md:text-2xl font-bold mb-4">サービスアドミン</h1>
  
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {cardsList.map((card) => (
            <Link href={card.link} key={card.id} className="block">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex flex-col items-center justify-center p-2">
                      <CardTitle className="text-sm">{card.title}</CardTitle>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
}
