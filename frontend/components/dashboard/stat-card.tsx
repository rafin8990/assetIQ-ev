import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { statAccentStyles } from "@/lib/brand"
import { cn } from "@/lib/utils"
import type { DashboardStat } from "@/types"

const trendIcons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus,
}

export function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  accent,
}: DashboardStat) {
  const styles = statAccentStyles[accent]
  const TrendIcon = trendIcons[trend]

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md",
        styles.card
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
            styles.icon
          )}
        >
          <Icon className={cn("size-5", styles.iconColor)} />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            trend === "down"
              ? styles.trendDown
              : trend === "neutral"
                ? "bg-[#f0f1f3] text-[#5c6370]"
                : styles.trendUp
          )}
        >
          {trend !== "neutral" && <TrendIcon className="size-3" />}
          {change}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-[#8b95a5]">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-[#373B44] md:text-3xl">
          {value}
        </p>
      </div>
    </div>
  )
}
