import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { MovementHistoryItem } from "@/types"

type MovementHistoryProps = {
  items: MovementHistoryItem[]
}

export function MovementHistory({ items }: MovementHistoryProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
      <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
        <h3 className="text-base font-semibold text-white">
          Last Items Movement History
        </h3>
        <p className="text-sm text-white/70">
          Recent inbound and outbound item transactions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Item Code
              </th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Item Name
              </th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Movement
              </th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Qty
              </th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Location
              </th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8eaed]">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-[#8b95a5]"
                >
                  No recent stock or outbound movements yet.
                </td>
              </tr>
            ) : (
              items.map((item) => {
              const isIn = item.movement === "in"

              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-[#f8f9fb]"
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-[#373B44]">
                    {item.itemCode}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-[#373B44]">
                    {item.itemName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                        isIn
                          ? "bg-[#e8f8f0] text-[#2d8f65]"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {isIn ? (
                        <ArrowDownLeft className="size-3" />
                      ) : (
                        <ArrowUpRight className="size-3" />
                      )}
                      {isIn ? "IN" : "OUT"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[#373B44]">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.location}
                  </td>
                  <td className="px-5 py-3.5 text-[#8b95a5]">{item.time}</td>
                </tr>
              )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
