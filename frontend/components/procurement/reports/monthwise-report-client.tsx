"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { ReportDataTable } from "@/components/procurement/reports/report-data-table"
import { ReportScreenHeader } from "@/components/procurement/reports/report-screen-header"
import { ReportSummaryCards } from "@/components/procurement/reports/report-summary-cards"
import {
  formatCurrency,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/procurement/reports/report-utils"
import { selectClassName } from "@/components/purchase-orders/purchase-order-constants"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { downloadPurchaseOrderReport } from "@/lib/procurement-reports/download-purchase-order-report"
import { getMonthwisePurchaseOrderReport } from "@/services/purchase-order-reports"
import type { MonthwiseReport } from "@/types/purchase-order-reports"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "month_label", header: "Month" },
  { key: "order_count", header: "Orders", align: "right" },
  { key: "total_amount", header: "Total Amount", align: "right" },
  { key: "total_paid", header: "Total Paid", align: "right" },
  { key: "total_due", header: "Total Due", align: "right" },
]

const emptySummary = {
  order_count: 0,
  total_amount: 0,
  total_paid: 0,
  total_due: 0,
}

function buildRows(report: MonthwiseReport | null): ReportTableRow[] {
  if (!report) return []

  return report.months.map((row, index) => ({
    sl: index + 1,
    month_label: row.month_label,
    order_count: row.order_count,
    total_amount: formatCurrency(row.total_amount),
    total_paid: formatCurrency(row.total_paid),
    total_due: formatCurrency(row.total_due),
  }))
}

export function MonthwiseReportClient() {
  const [year, setYear] = React.useState(String(new Date().getFullYear()))
  const [report, setReport] = React.useState<MonthwiseReport | null>(null)
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
      const data = await getMonthwisePurchaseOrderReport(Number(year))
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError ? err.message : "Failed to load monthwise report"
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
      await downloadPurchaseOrderReport({
        title: "Monthwise Purchase Order Report",
        subtitle: `Year: ${report.year}`,
        fileName: `monthwise-purchase-order-report-${report.year}.pdf`,
        columns,
        rows,
        summary,
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#373B44]">
          Monthwise Report
        </h1>
        <p className="text-[#8b95a5]">
          View monthly purchase order totals for a selected year.
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
            title="Monthwise Purchase Order Report"
            subtitle={`Year: ${report.year}`}
          />
          <ReportSummaryCards summary={summary} />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
