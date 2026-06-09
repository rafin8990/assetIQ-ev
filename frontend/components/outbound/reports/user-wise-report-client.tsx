"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { ReportDataTable } from "@/components/procurement/reports/report-data-table"
import { ReportScreenHeader } from "@/components/procurement/reports/report-screen-header"
import { OutRequestReportSummaryCards } from "@/components/outbound/reports/out-request-report-summary-cards"
import {
  formatQuantity,
  formatReportDate,
  toInputDate,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/outbound/reports/report-utils"
import { selectClassName } from "@/components/purchase-orders/purchase-order-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { downloadOutRequestReport } from "@/lib/outbound-reports/download-out-request-report"
import { getUserWiseOutRequestReport } from "@/services/out-request-reports"
import { getUsers } from "@/services/users"
import type { UserWiseOutRequestReport } from "@/types/out-request-reports"
import type { User } from "@/types/users"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "user_name", header: "User" },
  { key: "request_count", header: "Requests", align: "right" },
  { key: "item_count", header: "Items", align: "right" },
  { key: "total_requested_quantity", header: "Total Requested", align: "right" },
  { key: "total_out_quantity", header: "Total Out", align: "right" },
]

const emptySummary = {
  request_count: 0,
  item_count: 0,
  total_requested_quantity: 0,
  total_out_quantity: 0,
}

function buildRows(report: UserWiseOutRequestReport | null): ReportTableRow[] {
  if (!report) return []

  return report.users.map((user, index) => ({
    sl: index + 1,
    user_name: user.user_name ?? `User #${user.user_id}`,
    request_count: user.request_count,
    item_count: user.item_count,
    total_requested_quantity: formatQuantity(user.total_requested_quantity),
    total_out_quantity: formatQuantity(user.total_out_quantity),
  }))
}

export function UserWiseReportClient() {
  const today = toInputDate()
  const monthStart = toInputDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const [fromDate, setFromDate] = React.useState(monthStart)
  const [toDate, setToDate] = React.useState(today)
  const [userId, setUserId] = React.useState("")
  const [users, setUsers] = React.useState<User[]>([])
  const [report, setReport] = React.useState<UserWiseOutRequestReport | null>(
    null
  )
  const [loading, setLoading] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    void getUsers({ limit: 500, sortBy: "name", sortOrder: "asc" })
      .then(result => setUsers(result.data))
      .catch(() => setUsers([]))
  }, [])

  const loadReport = React.useCallback(async () => {
    if (fromDate > toDate) {
      setError("From date must be on or before to date")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getUserWiseOutRequestReport(
        fromDate,
        toDate,
        userId ? Number(userId) : undefined
      )
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError ? err.message : "Failed to load user wise report"
      )
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, userId])

  React.useEffect(() => {
    void loadReport()
  }, [loadReport])

  const rows = buildRows(report)
  const summary = report?.summary ?? emptySummary

  const selectedUserName =
    userId && users.find(user => String(user.id) === userId)?.name

  const handleDownload = async () => {
    if (!report) return

    setDownloading(true)
    try {
      const userLabel = selectedUserName
        ? ` | User: ${selectedUserName}`
        : ""
      await downloadOutRequestReport({
        title: "User Wise Out Request Report",
        subtitle: `${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}${userLabel}`,
        fileName: `user-wise-out-request-report-${report.from_date}-${report.to_date}.pdf`,
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
          User Wise Report
        </h1>
        <p className="text-[#8b95a5]">
          View out request totals grouped by user for a selected date range.
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
              User
            </label>
            <select
              value={userId}
              onChange={event => setUserId(event.target.value)}
              className={selectClassName}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
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
            title="User Wise Out Request Report"
            subtitle={`${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}${selectedUserName ? ` | User: ${selectedUserName}` : ""}`}
          />
          <OutRequestReportSummaryCards summary={summary} showItemCount />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
