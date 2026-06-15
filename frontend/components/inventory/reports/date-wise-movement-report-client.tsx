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
import { getDailyMovementReport } from "@/services/inventory-reports"
import type { DailyMovementReport } from "@/types/inventory-reports"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "movement_number", header: "Movement #" },
  { key: "movement_date", header: "Date" },
  { key: "movement_status", header: "Status" },
  { key: "source_location_name", header: "Source" },
  { key: "destination_location_name", header: "Destination" },
  { key: "item_name", header: "Item" },
  { key: "requested_quantity", header: "Requested", align: "right" },
  { key: "confirmed_quantity", header: "Confirmed", align: "right" },
  { key: "requested_by_name", header: "Requested By" },
]

const emptySummary = {
  movement_count: 0,
  item_count: 0,
  total_requested_quantity: 0,
  total_confirmed_quantity: 0,
}

function buildRows(report: DailyMovementReport | null): ReportTableRow[] {
  if (!report) return []

  return report.items.map((item, index) => ({
    sl: index + 1,
    movement_number: item.movement_number,
    movement_date: formatReportDateTime(item.movement_date),
    movement_status: formatStatusLabel(item.movement_status),
    source_location_name: item.source_location_name ?? "—",
    destination_location_name: item.destination_location_name ?? "—",
    item_name: item.item_name ?? "—",
    requested_quantity: formatQuantity(item.requested_quantity),
    confirmed_quantity: formatQuantity(item.confirmed_quantity),
    requested_by_name: item.requested_by_name ?? "—",
  }))
}

export function DateWiseMovementReportClient() {
  const [date, setDate] = React.useState(toInputDate())
  const [report, setReport] = React.useState<DailyMovementReport | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadReport = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getDailyMovementReport(date)
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load date-wise movement report"
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
      await downloadInventoryMovementReport({
        title: "Date-wise Movement History",
        subtitle: `Date: ${formatReportDate(report.date)}`,
        fileName: `date-wise-movement-report-${report.date}.pdf`,
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
          Date-wise Movement History
        </h1>
        <p className="text-[#8b95a5]">
          View stock movement line items for a selected date.
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
            title="Date-wise Movement History"
            subtitle={`Date: ${formatReportDate(report.date)}`}
          />
          <InventoryMovementReportSummaryCards summary={summary} showItemCount />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
