"use client"

import * as React from "react"
import { Bell, PanelLeft, Search } from "lucide-react"

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { UserAccountMenu } from "@/components/layout/user-account-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type DashboardNavbarProps = {
  collapsed?: boolean
  onToggleSidebar?: () => void
}

export function DashboardNavbar({
  collapsed = false,
  onToggleSidebar,
}: DashboardNavbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  const handleToggle = () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      onToggleSidebar?.()
    } else {
      setMobileNavOpen(true)
    }
  }

  return (
    <div className="shrink-0 px-4 pt-4 md:pr-6 md:pl-2">
      <div className="flex min-w-0 items-center md:-ml-5">
        <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggle}
            className={cn(
              "size-auto w-10 shrink-0 rounded-none rounded-l-xl border-0 border-r border-[#e8eaed] bg-white text-[#5c6370] shadow-none hover:bg-[#f8f9fa]",
              "h-auto min-h-[52px]"
            )}
            aria-label={
              collapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            <PanelLeft className="size-4" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-2">
            <div className="relative hidden w-full max-w-[280px] sm:block">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#b0b8c4]" />
              <Input
                type="search"
                placeholder="Search..."
                className="h-9 rounded-full border-[#e8eaed] bg-white pl-9 text-sm placeholder:text-[#b0b8c4] focus-visible:border-[#4DC591] focus-visible:ring-[#4DC591]/20"
              />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                className="relative flex size-10 items-center justify-center rounded-full bg-[#e8f8f0] transition-colors hover:bg-[#d9f2e6]"
                aria-label="Notifications"
              >
                <Bell className="size-[18px] text-[#4DC591]" />
                <span className="absolute top-2 right-2.5 size-2 rounded-full bg-[#4DC591] ring-2 ring-white" />
              </button>

              <UserAccountMenu />
            </div>
          </div>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger className="sr-only">Open menu</SheetTrigger>
        <SheetContent
          side="left"
          className="w-[260px] max-w-[85vw] border-[#e8eaed] p-0"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <DashboardSidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
