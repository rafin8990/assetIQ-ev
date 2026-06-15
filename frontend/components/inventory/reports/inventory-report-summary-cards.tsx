import type {
  InventoryMovementReportSummary,
  MainStockUpdateReportSummary,
} from "@/types/inventory-reports"

import { formatQuantity } from "./report-utils"

type InventoryMovementReportSummaryCardsProps = {
  summary: InventoryMovementReportSummary
  showItemCount?: boolean
}

export function InventoryMovementReportSummaryCards({
  summary,
  showItemCount = false,
}: InventoryMovementReportSummaryCardsProps) {
  const cards = [
    { label: "Movements", value: String(summary.movement_count) },
    ...(showItemCount
      ? [{ label: "Items", value: String(summary.item_count ?? 0) }]
      : []),
    {
      label: "Total Requested",
      value: formatQuantity(summary.total_requested_quantity),
    },
    {
      label: "Total Confirmed",
      value: formatQuantity(summary.total_confirmed_quantity),
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

type MainStockUpdateReportSummaryCardsProps = {
  summary: MainStockUpdateReportSummary
}

export function MainStockUpdateReportSummaryCards({
  summary,
}: MainStockUpdateReportSummaryCardsProps) {
  const cards = [
    { label: "Entries", value: String(summary.entry_count) },
    { label: "Items", value: String(summary.item_count ?? 0) },
    {
      label: "Total Quantity",
      value: formatQuantity(summary.total_quantity),
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
