"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { InventoryMovementReportSummaryCards } from "@/components/inventory/reports/inventory-report-summary-cards"
import {
  formatQuantity,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/inventory/reports/report-utils"
import { selectClassName } from "@/components/purchase-orders/purchase-order-constants"
import { ReportDataTable } from "@/components/procurement/reports/report-data-table"
import { ReportScreenHeader } from "@/components/procurement/reports/report-screen-header"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { downloadInventoryMovementReport } from "@/lib/inventory-reports/download-inventory-report"
import { getMonthwiseMovementReport } from "@/services/inventory-reports"
import type { MonthwiseMovementReport } from "@/types/inventory-reports"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "month_label", header: "Month" },
  { key: "movement_count", header: "Movements", align: "right" },
  { key: "item_count", header: "Items", align: "right" },
  { key: "total_requested_quantity", header: "Total Requested", align: "right" },
  { key: "total_confirmed_quantity", header: "Total Confirmed", align: "right" },
]

const emptySummary = {
  movement_count: 0,
  item_count: 0,
  total_requested_quantity: 0,
  total_confirmed_quantity: 0,
}

function buildRows(report: MonthwiseMovementReport | null): ReportTableRow[] {
  if (!report) return []

  return report.months.map((row, index) => ({
    sl: index + 1,
    month_label: row.month_label,
    movement_count: row.movement_count,
    item_count: row.item_count,
    total_requested_quantity: formatQuantity(row.total_requested_quantity),
    total_confirmed_quantity: formatQuantity(row.total_confirmed_quantity),
  }))
}

export function MonthwiseMovementReportClient() {
  const [year, setYear] = React.useState(String(new Date().getFullYear()))
  const [report, setReport] = React.useState<MonthwiseMovementReport | null>(
    null
  )
  const [loading, setLoading] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 8 }, (_, index) => currentYear - index)
  }, [])

  const loadReport = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMonthwiseMovementReport(Number(year))
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load monthly movement report"
      )
    } finally {
      setLoading(false)
    }
  }, [year])

  React.useEffect(() => {
    void loadReport()
  }, [loadReport])

  const rows = buildRows(report)
  const summary = report?.summary ?? emptySummary

  const handleDownload = async () => {
    if (!report) return

    setDownloading(true)
    try {
      await downloadInventoryMovementReport({
        title: "Monthly Movement Report",
        subtitle: `Year: ${report.year}`,
        fileName: `monthly-movement-report-${report.year}.pdf`,
        columns,
        rows,
        summary,
        showItemCount: true,
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#373B44]">
          Monthly Movement Report
        </h1>
        <p className="text-[#8b95a5]">
          View monthly stock movement totals for a selected year.
        </p>
      </div>

      <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full max-w-xs">
            <label className="mb-1.5 block text-sm font-medium text-[#373B44]">
              Year
            </label>
            <select
              value={year}
              onChange={event => setYear(event.target.value)}
              className={selectClassName}
            >
              {yearOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void loadReport()} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Generate Report
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleDownload()}
              disabled={!report || downloading || loading}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {report && (
        <>
          <ReportScreenHeader
            title="Monthly Movement Report"
            subtitle={`Year: ${report.year}`}
          />
          <InventoryMovementReportSummaryCards summary={summary} showItemCount />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
