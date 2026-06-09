"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { ReportDataTable } from "@/components/procurement/reports/report-data-table"
import { ReportScreenHeader } from "@/components/procurement/reports/report-screen-header"
import { OutRequestReportSummaryCards } from "@/components/outbound/reports/out-request-report-summary-cards"
import {
  formatQuantity,
  formatReportDate,
  formatReportDateTime,
  formatStatusLabel,
  toInputDate,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/outbound/reports/report-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { downloadOutRequestReport } from "@/lib/outbound-reports/download-out-request-report"
import { getDailyOutRequestReport } from "@/services/out-request-reports"
import type { DailyOutRequestReport } from "@/types/out-request-reports"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "request_id", header: "Request ID" },
  { key: "request_date", header: "Date" },
  { key: "item_name", header: "Item" },
  { key: "requested_quantity", header: "Requested", align: "right" },
  { key: "out_quantity", header: "Out", align: "right" },
  { key: "unit_name", header: "Unit" },
  { key: "item_status", header: "Item Status" },
]

const emptySummary = {
  request_count: 0,
  item_count: 0,
  total_requested_quantity: 0,
  total_out_quantity: 0,
}

function buildRows(report: DailyOutRequestReport | null): ReportTableRow[] {
  if (!report) return []

  return report.items.map((item, index) => ({
    sl: index + 1,
    request_id: item.request_id,
    request_date: formatReportDateTime(item.request_date),
    item_name: item.item_name ?? "—",
    requested_quantity: formatQuantity(item.requested_quantity),
    out_quantity: formatQuantity(item.out_quantity),
    unit_name: item.unit_name ?? "—",
    item_status: formatStatusLabel(item.item_status),
    request_status: formatStatusLabel(item.request_status),
  }))
}

export function DailyReportClient() {
  const [date, setDate] = React.useState(toInputDate())
  const [report, setReport] = React.useState<DailyOutRequestReport | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadReport = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getDailyOutRequestReport(date)
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
      await downloadOutRequestReport({
        title: "Today's Out Request Report",
        subtitle: `Date: ${formatReportDate(report.date)}`,
        fileName: `daily-out-request-report-${report.date}.pdf`,
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
          Today&apos;s Report
        </h1>
        <p className="text-[#8b95a5]">
          View out request items, requested quantity, and out quantity for a
          selected day.
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
            title="Today's Out Request Report"
            subtitle={`Date: ${formatReportDate(report.date)}`}
          />
          <OutRequestReportSummaryCards summary={summary} showItemCount />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
