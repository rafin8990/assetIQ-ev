import Image from "next/image"
import { Loader2, RefreshCw, Sparkles } from "lucide-react"

import { BdClock } from "@/components/dashboard/bd-clock"
import { Button } from "@/components/ui/button"

type DashboardHeaderProps = {
  userName?: string | null
  apiStatus?: string | null
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function DashboardHeader({
  userName,
  apiStatus,
  onRefresh,
  isRefreshing = false,
}: DashboardHeaderProps) {
  const greetingName = userName?.trim() || "there"

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4DC591] via-[#2f7a5c] to-[#373B44] p-6 text-white shadow-lg md:p-8">
      <div className="absolute -top-12 -left-12 size-48 rounded-full bg-[#4DC591]/25" />
      <div className="absolute -bottom-8 -right-8 size-32 rounded-full bg-[#373B44]/40" />

      {onRefresh && (
        <div className="relative mb-4 flex justify-end">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            {isRefreshing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            Refresh
          </Button>
        </div>
      )}

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 md:items-center">
          <Image
            src="/logo/ev-logo.svg"
            alt="EV Logo"
            width={72}
            height={72}
            className="size-16 shrink-0 rounded-2xl shadow-md md:size-[72px]"
            priority
          />
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="size-3.5 text-[#4DC591]" />
              AssetIQ Operations Dashboard
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back, {greetingName}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/75 md:text-base">
              Full overview of assets, procurement, outbound operations, stock
              levels, pending approvals, and recent activity across the system.
            </p>
            {apiStatus && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#d8ffef]">
                <span className="size-2 rounded-full bg-[#4DC591]" />
                API {apiStatus}
              </p>
            )}
          </div>
        </div>

        <BdClock />
      </div>
    </div>
  )
}
