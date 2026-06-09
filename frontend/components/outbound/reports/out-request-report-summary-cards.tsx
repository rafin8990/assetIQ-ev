import type { OutRequestReportSummary } from "@/types/out-request-reports"

import { formatQuantity } from "./report-utils"

type OutRequestReportSummaryCardsProps = {
  summary: OutRequestReportSummary
  showItemCount?: boolean
}

export function OutRequestReportSummaryCards({
  summary,
  showItemCount = false,
}: OutRequestReportSummaryCardsProps) {
  const cards = [
    { label: "Requests", value: String(summary.request_count) },
    ...(showItemCount
      ? [{ label: "Items", value: String(summary.item_count ?? 0) }]
      : []),
    {
      label: "Total Requested",
      value: formatQuantity(summary.total_requested_quantity),
    },
    {
      label: "Total Out",
      value: formatQuantity(summary.total_out_quantity),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
