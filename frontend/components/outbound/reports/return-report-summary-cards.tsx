import type { ReturnReportSummary } from "@/types/return-reports"

import { formatQuantity } from "./report-utils"

type ReturnReportSummaryCardsProps = {
  summary: ReturnReportSummary
}

export function ReturnReportSummaryCards({
  summary,
}: ReturnReportSummaryCardsProps) {
  const cards = [
    { label: "Returns", value: String(summary.return_count) },
    { label: "Items", value: String(summary.item_count) },
    {
      label: "Total Returned Qty",
      value: formatQuantity(summary.total_return_quantity),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
