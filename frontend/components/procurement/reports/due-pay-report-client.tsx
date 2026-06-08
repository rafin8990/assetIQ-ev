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
import { formatOrderType, selectClassName } from "@/components/purchase-orders/purchase-order-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { downloadPurchaseOrderReport } from "@/lib/procurement-reports/download-purchase-order-report"
import { getDuePaidPurchaseOrderReport } from "@/services/purchase-order-reports"
import type { DuePaidReport } from "@/types/purchase-order-reports"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "po_number", header: "PO No" },
  { key: "created_at", header: "Date" },
  { key: "status", header: "Status" },
  { key: "order_type", header: "Type" },
  { key: "total_amount", header: "Total", align: "right" },
  { key: "paid_amount", header: "Paid", align: "right" },
  { key: "due_amount", header: "Due", align: "right" },
  { key: "created_by_name", header: "Created By" },
]

const emptySummary = {
  order_count: 0,
  total_amount: 0,
  total_paid: 0,
  total_due: 0,
}

function buildRows(report: DuePaidReport | null): ReportTableRow[] {
  if (!report) return []

  return report.orders.map((order, index) => ({
    sl: index + 1,
    po_number: order.po_number,
    created_at: formatReportDateTime(order.created_at),
    status: formatStatusLabel(order.status),
    order_type: formatOrderType(order.order_type as "by_requisition" | "direct"),
    total_amount: formatCurrency(order.total_amount),
    paid_amount: formatCurrency(order.paid_amount),
    due_amount: formatCurrency(order.due_amount),
    created_by_name: order.created_by_name ?? "—",
  }))
}

export function DuePayReportClient() {
  const today = toInputDate()
  const monthStart = toInputDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const [fromDate, setFromDate] = React.useState(monthStart)
  const [toDate, setToDate] = React.useState(today)
  const [paymentType, setPaymentType] = React.useState<"due" | "paid">("due")
  const [report, setReport] = React.useState<DuePaidReport | null>(null)
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
      const data = await getDuePaidPurchaseOrderReport(
        fromDate,
        toDate,
        paymentType
      )
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load due/paid report"
      )
    } finally {
      setLoading(false)
    }
  }, [fromDate, paymentType, toDate])

  const rows = buildRows(report)
  const summary = report?.summary ?? emptySummary

  const handleDownload = async () => {
    if (!report) return

    setDownloading(true)
    try {
      await downloadPurchaseOrderReport({
        title:
          paymentType === "due"
            ? "List of Due Purchase Order Report"
            : "List of Paid Purchase Order Report",
        subtitle: `${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`,
        fileName: `${paymentType}-purchase-order-report-${report.from_date}-${report.to_date}.pdf`,
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
          List of Due/Pay Report
        </h1>
        <p className="text-[#8b95a5]">
          Select a date range and payment type to generate the report.
        </p>
      </div>

      <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#373B44]">
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={event =>
                setPaymentType(event.target.value as "due" | "paid")
              }
              className={selectClassName}
            >
              <option value="due">Due</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
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
            title={
              paymentType === "due"
                ? "List of Due Purchase Order Report"
                : "List of Paid Purchase Order Report"
            }
            subtitle={`${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`}
          />
          <ReportSummaryCards summary={summary} />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
