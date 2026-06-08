import type { PurchaseOrderReportSummary } from "@/types/purchase-order-reports"

import { formatCurrency } from "./report-utils"

type ReportSummaryCardsProps = {
  summary: PurchaseOrderReportSummary
  showItemCount?: boolean
}

export function ReportSummaryCards({
  summary,
  showItemCount = false,
}: ReportSummaryCardsProps) {
  const cards = [
    { label: "Orders", value: String(summary.order_count) },
    ...(showItemCount
      ? [{ label: "Items", value: String(summary.item_count ?? 0) }]
      : []),
    { label: "Total Amount", value: formatCurrency(summary.total_amount) },
    { label: "Total Paid", value: formatCurrency(summary.total_paid) },
    { label: "Total Due", value: formatCurrency(summary.total_due) },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(card => (
        <div
          key={card.label}
          className="rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[#8b95a5]">
            {card.label}
          </p>
          <p className="mt-2 text-xl font-bold text-[#373B44]">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
