"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { chartColors } from "@/lib/brand"
import { cn } from "@/lib/utils"
import type { ChartDataPoint } from "@/types"

type OverviewChartProps = {
  title: string
  description?: string
  data: ChartDataPoint[]
  type?: "area" | "bar"
  accent?: "green" | "dark"
}

export function OverviewChart({
  title,
  description,
  data,
  type = "area",
  accent = "green",
}: OverviewChartProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const strokeColor = accent === "green" ? chartColors[0] : chartColors[1]

  return (
    <div className="h-full overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
      <div
        className={cn(
          "border-b border-[#e8eaed] px-5 py-4",
          accent === "green"
            ? "bg-gradient-to-r from-[#e8f8f0]/80 to-white"
            : "bg-gradient-to-r from-[#f0f1f3] to-white"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-8 w-1 rounded-full",
              accent === "green" ? "bg-[#4DC591]" : "bg-[#373B44]"
            )}
          />
          <div>
            <h3 className="text-base font-semibold text-[#373B44]">{title}</h3>
            {description && (
              <p className="text-sm text-[#8b95a5]">{description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 pt-2">
        <div className="h-[280px] min-w-0 w-full">
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-[#8b95a5]">
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {type === "area" ? (
                <AreaChart
                  data={data}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="brandArea" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={chartColors[0]}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={chartColors[0]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e8eaed"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#8b95a5" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#8b95a5" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e8eaed",
                      borderRadius: "10px",
                      color: "#373B44",
                      boxShadow: "0 4px 12px rgba(55,59,68,0.08)",
                    }}
                    labelStyle={{ color: "#373B44", fontWeight: 600 }}
                    itemStyle={{ color: chartColors[0] }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={strokeColor}
                    fill="url(#brandArea)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={data}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e8eaed"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#8b95a5" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#8b95a5" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e8eaed",
                      borderRadius: "10px",
                      color: "#373B44",
                      boxShadow: "0 4px 12px rgba(55,59,68,0.08)",
                    }}
                    cursor={{ fill: "#e8f8f0" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
