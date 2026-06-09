import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PendingApprovalItem } from "@/types"

type PendingApprovalsTableProps = {
  items: PendingApprovalItem[]
}

const typeStyles: Record<
  PendingApprovalItem["type"],
  { badge: string; label: string }
> = {
  requisition: {
    badge: "bg-[#e8f8f0] text-[#2d8f65]",
    label: "Requisition",
  },
  purchase_order: {
    badge: "bg-[#f0f1f3] text-[#373B44]",
    label: "Purchase Order",
  },
  out_request: {
    badge: "bg-amber-50 text-amber-700",
    label: "Out Request",
  },
  return: {
    badge: "bg-sky-50 text-sky-700",
    label: "Return",
  },
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PendingApprovalsTable({ items }: PendingApprovalsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
      <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
        <h3 className="text-base font-semibold text-white">
          Pending Approvals
        </h3>
        <p className="text-sm text-white/70">
          Requisitions, purchase orders, out requests, and returns awaiting action
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Reference
              </th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">Type</th>
              <th className="px-5 py-3 font-semibold text-[#373B44]">
                Requested By
              </th>
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
                  colSpan={5}
                  className="px-5 py-10 text-center text-[#8b95a5]"
                >
                  <div className="inline-flex flex-col items-center gap-2">
                    <ClipboardList className="size-8 opacity-40" />
                    <span>No pending approvals. Everything is up to date.</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map(item => {
                const style = typeStyles[item.type]

                return (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="transition-colors hover:bg-[#f8f9fb]"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {item.reference}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          style.badge
                        )}
                      >
                        {item.typeLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {item.requestedBy ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={item.href}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" })
                        )}
                      >
                        Review
                      </Link>
                    </td>
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
