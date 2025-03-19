import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { List, Pen, Users, Scan } from 'lucide-react'

// カードのリスト
const cardsList = [
  { id: 1, title: "イベント新規作成", link: "admin/event/register", icon: Pen },
  { id: 2, title: "イベント一覧/編集", link: "admin/event/list", icon: List },
  { id: 3, title: "運営者リスト", link: "/operator/list", icon: Users },
  { id: 4, title: "QRコードスキャン", link: "/qr-code/scan", icon: Scan },
]
export default async function SimpleCardGrid() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  return (
    <div className="container mx-auto px-4 py-8 overflow-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {cardsList.map((card) => (
          <Link href={card.link} key={card.id} className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-row items-center justify-center p-2 tracking-wider">
                  <card.icon className="h-5 w-5 mr-3" />
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

