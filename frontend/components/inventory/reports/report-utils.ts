export function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

export function formatSourceTypeLabel(sourceType: string) {
  switch (sourceType) {
    case "manual":
      return "Manual"
    case "po_accept":
      return "PO Receiving"
    case "transfer":
      return "Transfer"
    case "return":
      return "Return"
    default:
      return sourceType
  }
}

export {
  formatReportDate,
  formatReportDateTime,
  formatStatusLabel,
  toInputDate,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/procurement/reports/report-utils"
