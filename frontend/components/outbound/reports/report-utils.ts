export function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

export {
  formatReportDate,
  formatReportDateTime,
  formatStatusLabel,
  toInputDate,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/procurement/reports/report-utils"
