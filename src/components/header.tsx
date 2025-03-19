import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar'
import { IconSeparator } from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'

export async function Header() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        {user ? (
          <Sidebar>
            <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
            </React.Suspense>
            {/* <SidebarFooter>
              <ThemeToggle />
            </SidebarFooter> */}
          </Sidebar>
        ) : (
          <Link href="/" target="_blank" rel="nofollow">

          </Link>
        )}
        <div className="flex items-center">
          <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button variant="link" asChild className="-ml-2">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}