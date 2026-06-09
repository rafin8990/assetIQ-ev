"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { ReportDataTable } from "@/components/procurement/reports/report-data-table"
import { ReportScreenHeader } from "@/components/procurement/reports/report-screen-header"
import { ReturnReportSummaryCards } from "@/components/outbound/reports/return-report-summary-cards"
import {
  formatQuantity,
  formatReportDate,
  formatReportDateTime,
  toInputDate,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/outbound/reports/report-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { downloadReturnReport } from "@/lib/outbound-reports/download-return-report"
import { getDateRangeReturnReport } from "@/services/return-reports"
import type { DateRangeReturnReport } from "@/types/return-reports"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "return_id", header: "Return ID" },
  { key: "out_request_id", header: "Out Request" },
  { key: "return_date", header: "Date" },
  { key: "item_name", header: "Item" },
  { key: "return_quantity", header: "Qty", align: "right" },
  { key: "unit_name", header: "Unit" },
  { key: "requested_by_name", header: "Requested By" },
  { key: "approved_by_name", header: "Approved By" },
]

const emptySummary = {
  return_count: 0,
  item_count: 0,
  total_return_quantity: 0,
}

function buildRows(report: DateRangeReturnReport | null): ReportTableRow[] {
  if (!report) return []

  return report.items.map((item, index) => ({
    sl: index + 1,
    return_id: item.return_id,
    out_request_id: item.out_request_id,
    return_date: formatReportDateTime(item.return_date),
    item_name: item.item_name ?? "—",
    return_quantity: formatQuantity(item.return_quantity),
    unit_name: item.unit_name ?? "—",
    requested_by_name: item.requested_by_name ?? "—",
    approved_by_name: item.approved_by_name ?? "—",
  }))
}

export function ReturnReportClient() {
  const today = toInputDate()
  const monthStart = toInputDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const [fromDate, setFromDate] = React.useState(monthStart)
  const [toDate, setToDate] = React.useState(today)
  const [report, setReport] = React.useState<DateRangeReturnReport | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadReport = React.useCallback(async () => {
    if (fromDate > toDate) {
      setError("From date must be on or before to date")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getDateRangeReturnReport(fromDate, toDate)
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError ? err.message : "Failed to load return report"
      )
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  React.useEffect(() => {
    void loadReport()
  }, [loadReport])

  const rows = buildRows(report)
  const summary = report?.summary ?? emptySummary

  const handleDownload = async () => {
    if (!report) return

    setDownloading(true)
    try {
      await downloadReturnReport({
        title: "Return Report",
        subtitle: `${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`,
        fileName: `return-report-${report.from_date}-${report.to_date}.pdf`,
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
          Return Report
        </h1>
        <p className="text-[#8b95a5]">
          View approved returns between a from date and to date.
        </p>
      </div>

      <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#373B44]">
              From Date
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={event => setFromDate(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#373B44]">
              To Date
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={event => setToDate(event.target.value)}
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-2">
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
            title="Return Report"
            subtitle={`${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`}
          />
          <ReturnReportSummaryCards summary={summary} />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
