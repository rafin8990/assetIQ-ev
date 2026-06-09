"use client"

import * as React from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { chartColors } from "@/lib/brand"
import type { ChartDataPoint } from "@/types"

type AssetPerformanceChartProps = {
  data: ChartDataPoint[]
  title?: string
  description?: string
  valueLabel?: string
  secondaryLabel?: string
  showSecondary?: boolean
}

export function AssetPerformanceChart({
  data,
  title = "Asset Performance",
  description = "Monthly performance score vs target benchmark",
  valueLabel = "Performance",
  secondaryLabel = "Target",
  showSecondary = true,
}: AssetPerformanceChartProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
      <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#e8f8f0]/80 to-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-[#4DC591]" />
          <div>
            <h3 className="text-base font-semibold text-[#373B44]">{title}</h3>
            <p className="text-sm text-[#8b95a5]">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-5 pt-2">
        <div className="h-[320px] min-w-0 w-full">
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-[#8b95a5]">
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
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
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8eaed",
                    borderRadius: "10px",
                    color: "#373B44",
                    boxShadow: "0 4px 12px rgba(55,59,68,0.08)",
                  }}
                />
                {showSecondary && (
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) =>
                      value === "value" ? valueLabel : secondaryLabel
                    }
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  name="value"
                  stroke={chartColors[0]}
                  strokeWidth={2.5}
                  dot={{ fill: chartColors[0], r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {showSecondary && (
                  <Line
                    type="monotone"
                    dataKey="secondary"
                    name="secondary"
                    stroke={chartColors[1]}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
