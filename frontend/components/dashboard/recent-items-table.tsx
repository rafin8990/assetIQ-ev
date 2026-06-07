import Link from "next/link"
import { Package } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Item } from "@/types/items"

type RecentItemsTableProps = {
  items: Item[]
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function RecentItemsTable({ items }: RecentItemsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
      <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
        <h3 className="text-base font-semibold text-white">
          Recently Added Items
        </h3>
        <p className="text-sm text-white/70">
          Latest items from your asset catalog
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
              <th className="px-5 py-3 font-semibold text-[#373B44]">ID</th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">Name</th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Category
              </th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">Brand</th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">Model</th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Created
              </th>
              <th className="px-5 py-3 text-right font-semibold text-[#373B44]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8eaed]">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-[#8b95a5]"
                >
                  <div className="inline-flex flex-col items-center gap-2">
                    <Package className="size-8 opacity-40" />
                    <span>No items yet. Add your first item to see it here.</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-[#f8f9fb]"
                >
                  <td className="px-5 py-3.5 font-medium text-[#373B44]">
                    #{item.id}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-[#373B44]">
                    {item.name}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.category_name ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.brand_name ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.model ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[#8b95a5]">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/assets/items/${item.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" })
                      )}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
