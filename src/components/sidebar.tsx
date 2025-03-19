'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger
} from '@/components/ui/sheet'
import { IconSidebar } from '@/components/ui/icons'
import { List, Pen, Users, Scan, Home } from 'lucide-react'
import Link from 'next/link'
export interface SidebarProps {
  children?: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" className="-ml-2 h-9 w-9 p-0">
        <IconSidebar className="h-6 w-6" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    </SheetTrigger>
    <SheetContent className="inset-y-0 flex h-auto w-[300px] flex-col p-0">
      <SheetHeader className="p-4"></SheetHeader>
      <div className="flex-1 overflow-auto m-6">
        {/* <div className="flex justify-center items-center mb-16"> */}
          {/* ロゴ */}
          {/* <img src="/logo_square.png" alt="logo" style={{ width: '40%' }} />
        </div> */}

        <div className="flex flex-col gap-5">
          <SheetTrigger asChild>
            <Link href={'/admin'}>
              <Button variant="ghost" className="w-full justify-start py-5">
                <Home className="mr-3 h-5 w-5" />
                <p className="font-bold text-sm">ホーム</p>
              </Button>
            </Link>
          </SheetTrigger>

          <SheetTrigger asChild>
            <Link href={'/admin/event/register'}>
              <Button variant="ghost" className="w-full justify-start py-5">
                <Pen className="mr-3 h-5 w-5" />
                <p className="font-bold text-sm">イベント新規作成</p>
              </Button>
            </Link>
            </SheetTrigger>

          <SheetTrigger asChild>
            <Link href={'/admin/event/list'}>
              <Button variant="ghost" className="w-full justify-start py-5">
                <List className="mr-3 h-5 w-5" />
                <p className="font-bold text-sm">イベント一覧/編集</p>
              </Button>
            </Link>
          </SheetTrigger>

          <SheetTrigger asChild>
            <Link href={'/admin/event/register'}>
              <Button variant="ghost" className="w-full justify-start py-5">
                <Users className="mr-3 h-5 w-5" />
                <p className="font-bold text-sm">運営リスト</p>
              </Button>
            </Link>
          </SheetTrigger>

          <SheetTrigger asChild>
            <Link href={'/admin/event/register'}>
              <Button variant="ghost" className="w-full justify-start py-5">
                <Scan className="mr-3 h-5 w-5" />
                <p className="font-bold text-sm">QRコードスキャン</p>
              </Button>
            </Link>
          </SheetTrigger>
          
        </div>
      </div>
      <div className='p-3'>
      </div>
    </SheetContent>
  </Sheet>
  )
}