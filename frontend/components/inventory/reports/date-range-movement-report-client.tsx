"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { InventoryMovementReportSummaryCards } from "@/components/inventory/reports/inventory-report-summary-cards"
import {
  formatQuantity,
  formatReportDate,
  formatReportDateTime,
  formatStatusLabel,
  toInputDate,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/inventory/reports/report-utils"
import { ReportDataTable } from "@/components/procurement/reports/report-data-table"
import { ReportScreenHeader } from "@/components/procurement/reports/report-screen-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { downloadInventoryMovementReport } from "@/lib/inventory-reports/download-inventory-report"
import { getDateRangeMovementReport } from "@/services/inventory-reports"
import type { DateRangeMovementReport } from "@/types/inventory-reports"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "movement_number", header: "Movement #" },
  { key: "created_at", header: "Date" },
  { key: "status", header: "Status" },
  { key: "source_location_name", header: "Source" },
  { key: "destination_location_name", header: "Destination" },
  { key: "item_count", header: "Items", align: "right" },
  { key: "total_requested_quantity", header: "Total Requested", align: "right" },
  { key: "total_confirmed_quantity", header: "Total Confirmed", align: "right" },
  { key: "requested_by_name", header: "Requested By" },
]

const emptySummary = {
  movement_count: 0,
  item_count: 0,
  total_requested_quantity: 0,
  total_confirmed_quantity: 0,
}

function buildRows(report: DateRangeMovementReport | null): ReportTableRow[] {
  if (!report) return []

  return report.movements.map((movement, index) => ({
    sl: index + 1,
    movement_number: movement.movement_number,
    created_at: formatReportDateTime(movement.created_at),
    status: formatStatusLabel(movement.status),
    source_location_name: movement.source_location_name ?? "—",
    destination_location_name: movement.destination_location_name ?? "—",
    item_count: movement.item_count,
    total_requested_quantity: formatQuantity(movement.total_requested_quantity),
    total_confirmed_quantity: formatQuantity(movement.total_confirmed_quantity),
    requested_by_name: movement.requested_by_name ?? "—",
  }))
}

export function DateRangeMovementReportClient() {
  const today = toInputDate()
  const monthStart = toInputDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const [fromDate, setFromDate] = React.useState(monthStart)
  const [toDate, setToDate] = React.useState(today)
  const [report, setReport] = React.useState<DateRangeMovementReport | null>(
    null
  )
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
      const data = await getDateRangeMovementReport(fromDate, toDate)
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load date range movement report"
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
      await downloadInventoryMovementReport({
        title: "Date Range Movement History",
        subtitle: `${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`,
        fileName: `date-range-movement-report-${report.from_date}-${report.to_date}.pdf`,
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
          Date Range Movement History
        </h1>
        <p className="text-[#8b95a5]">
          View stock movements between a from date and to date with totals.
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
            title="Date Range Movement History"
            subtitle={`${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`}
          />
          <InventoryMovementReportSummaryCards summary={summary} showItemCount />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
