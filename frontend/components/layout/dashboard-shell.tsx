"use client"

import * as React from "react"

import { DashboardNavbar } from "@/components/layout/dashboard-navbar"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { cn } from "@/lib/utils"

type DashboardShellProps = {
  children: React.ReactNode
}

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 72

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <div className="flex min-h-svh w-full bg-[#f8f9fb]">
      <aside
        className="relative hidden shrink-0 border-r border-[#e8eaed] bg-white transition-[width] duration-200 md:block"
        style={{ width: sidebarWidth }}
      >
        <div
          className="fixed inset-y-0 z-30 border-r border-[#e8eaed] bg-white transition-[width] duration-200"
          style={{ width: sidebarWidth }}
        >
          <DashboardSidebar collapsed={collapsed} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardNavbar
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
        />
        <main className={cn("flex-1 overflow-auto px-4 pb-4 md:px-6 md:pb-6")}>
          {children}
        </main>
      </div>
    </div>
  )
}
