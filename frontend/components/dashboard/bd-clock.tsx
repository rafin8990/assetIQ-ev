"use client"

import * as React from "react"
import { Clock } from "lucide-react"

function formatBdTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date)
}

function formatBdDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

type BdClockProps = {
  variant?: "default" | "hero"
}

export function BdClock({ variant = "default" }: BdClockProps) {
  const [now, setNow] = React.useState<Date | null>(null)
  const isHero = variant === "hero"

  React.useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={
        isHero
          ? "flex shrink-0 flex-col items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-10 py-8 text-center backdrop-blur-sm lg:items-start lg:text-left"
          : "flex shrink-0 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm"
      }
    >
      <div
        className={
          isHero
            ? "flex size-16 items-center justify-center rounded-full bg-[#4DC591] shadow-lg"
            : "flex size-10 items-center justify-center rounded-full bg-[#4DC591]"
        }
      >
        <Clock className={isHero ? "size-8 text-white" : "size-5 text-white"} />
      </div>
      <div>
        <p className={isHero ? "text-sm text-white/60" : "text-xs text-white/60"}>
          Bangladesh Time (BST)
        </p>
        <p
          className={
            isHero
              ? "font-mono text-4xl font-bold tracking-wide tabular-nums md:text-5xl"
              : "font-mono text-2xl font-bold tracking-wide tabular-nums"
          }
        >
          {now ? formatBdTime(now) : "--:--:-- --"}
        </p>
        <p className={isHero ? "mt-1 text-sm text-white/70" : "text-xs text-white/70"}>
          {now ? formatBdDate(now) : "Loading..."}
        </p>
      </div>
    </div>
  )
}
