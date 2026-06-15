"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { InventoryMovementReportSummaryCards } from "@/components/inventory/reports/inventory-report-summary-cards"
import {
  formatQuantity,
  formatReportDate,
  toInputDate,
  type ReportTableColumn,
  type ReportTableRow,
} from "@/components/inventory/reports/report-utils"
import { selectClassName } from "@/components/purchase-orders/purchase-order-constants"
import { ReportDataTable } from "@/components/procurement/reports/report-data-table"
import { ReportScreenHeader } from "@/components/procurement/reports/report-screen-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { downloadInventoryMovementReport } from "@/lib/inventory-reports/download-inventory-report"
import { getUserWiseMovementReport } from "@/services/inventory-reports"
import { getUsers } from "@/services/users"
import type { UserWiseMovementReport } from "@/types/inventory-reports"
import type { User } from "@/types/users"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "user_name", header: "User" },
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

function buildRows(report: UserWiseMovementReport | null): ReportTableRow[] {
  if (!report) return []

  return report.users.map((user, index) => ({
    sl: index + 1,
    user_name: user.user_name ?? `User #${user.user_id}`,
    movement_count: user.movement_count,
    item_count: user.item_count,
    total_requested_quantity: formatQuantity(user.total_requested_quantity),
    total_confirmed_quantity: formatQuantity(user.total_confirmed_quantity),
  }))
}

export function UserWiseMovementReportClient() {
  const today = toInputDate()
  const monthStart = toInputDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const [fromDate, setFromDate] = React.useState(monthStart)
  const [toDate, setToDate] = React.useState(today)
  const [userId, setUserId] = React.useState("")
  const [users, setUsers] = React.useState<User[]>([])
  const [report, setReport] = React.useState<UserWiseMovementReport | null>(
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
      const data = await getUserWiseMovementReport(
        fromDate,
        toDate,
        userId ? Number(userId) : undefined
      )
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load user-wise movement report"
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

  const handleDownload = async () => {
    if (!report) return

    setDownloading(true)
    try {
      await downloadInventoryMovementReport({
        title: "User-wise Movement History",
        subtitle: `${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`,
        fileName: `user-wise-movement-report-${report.from_date}-${report.to_date}.pdf`,
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
          User-wise Movement History
        </h1>
        <p className="text-[#8b95a5]">
          View stock movement totals grouped by requesting user.
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#373B44]">
              User
            </label>
            <select
              value={userId}
              onChange={event => setUserId(event.target.value)}
              className={selectClassName}
            >
              <option value="">All users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
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
            title="User-wise Movement History"
            subtitle={`${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`}
          />
          <InventoryMovementReportSummaryCards summary={summary} showItemCount />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
