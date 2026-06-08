"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { ReportDataTable } from "@/components/procurement/reports/report-data-table"
import { ReportScreenHeader } from "@/components/procurement/reports/report-screen-header"
import { ReportSummaryCards } from "@/components/procurement/reports/report-summary-cards"
import {
  formatCurrency,
  formatReportDate,
  formatReportDateTime,
  formatStatusLabel,
  toInputDate,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/procurement/reports/report-utils"
import { selectClassName } from "@/components/purchase-orders/purchase-order-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { downloadPurchaseOrderReport } from "@/lib/procurement-reports/download-purchase-order-report"
import { getDailyPurchaseOrderReport } from "@/services/purchase-order-reports"
import type { DailyReport } from "@/types/purchase-order-reports"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "po_number", header: "PO No" },
  { key: "po_date", header: "Date" },
  { key: "item_name", header: "Item" },
  { key: "quantity", header: "Qty", align: "right" },
  { key: "unit_name", header: "Unit" },
  { key: "per_unit_amount", header: "Rate", align: "right" },
  { key: "line_total", header: "Line Total", align: "right" },
  { key: "po_total_amount", header: "PO Total", align: "right" },
  { key: "po_due_amount", header: "PO Due", align: "right" },
]

const emptySummary = {
  order_count: 0,
  item_count: 0,
  total_amount: 0,
  total_paid: 0,
  total_due: 0,
}

function buildRows(report: DailyReport | null): ReportTableRow[] {
  if (!report) return []

  return report.items.map((item, index) => ({
    sl: index + 1,
    po_number: item.po_number,
    po_date: formatReportDateTime(item.po_date),
    item_name: item.item_name ?? "—",
    quantity: item.quantity,
    unit_name: item.unit_name ?? "—",
    per_unit_amount: formatCurrency(item.per_unit_amount),
    line_total: formatCurrency(item.line_total),
    po_total_amount: formatCurrency(item.po_total_amount),
    po_due_amount: formatCurrency(item.po_due_amount),
    status: formatStatusLabel(item.status),
  }))
}

export function DailyReportClient() {
  const [date, setDate] = React.useState(toInputDate())
  const [report, setReport] = React.useState<DailyReport | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadReport = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getDailyPurchaseOrderReport(date)
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError ? err.message : "Failed to load daily report"
      )
    } finally {
      setLoading(false)
    }
  }, [date])

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
        title: "Today's Purchase Order Report",
        subtitle: `Date: ${formatReportDate(report.date)}`,
        fileName: `daily-purchase-order-report-${report.date}.pdf`,
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
          Today&apos;s Purchase Order Report
        </h1>
        <p className="text-[#8b95a5]">
          View purchase items, total amount, and total due for a selected day.
        </p>
      </div>

      <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-[#373B44]">
              Report Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={event => setDate(event.target.value)}
              className="max-w-xs"
            />
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
            title="Today's Purchase Order Report"
            subtitle={`Date: ${formatReportDate(report.date)}`}
          />
          <ReportSummaryCards summary={summary} showItemCount />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
