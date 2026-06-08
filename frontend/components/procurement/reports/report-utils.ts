import { formatCurrency } from "@/components/purchase-orders/purchase-order-constants"

export function toInputDate(value: Date = new Date()) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatReportDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatReportDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export { formatCurrency }

export type ReportTableColumn = {
  key: string
  header: string
  align?: "left" | "right" | "center"
  width?: string | number
}

export type ReportTableRow = Record<string, string | number>
