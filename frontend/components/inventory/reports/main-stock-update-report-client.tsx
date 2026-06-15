"use client"

import * as React from "react"
import { FileDown, Loader2, Search } from "lucide-react"

import { MainStockUpdateReportSummaryCards } from "@/components/inventory/reports/inventory-report-summary-cards"
import {
  formatQuantity,
  formatReportDate,
  formatReportDateTime,
  formatSourceTypeLabel,
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
import { downloadMainStockUpdateReport } from "@/lib/inventory-reports/download-inventory-report"
import { getItems } from "@/services/items"
import { getMainStockUpdateReport } from "@/services/inventory-reports"
import { getVendors } from "@/services/vendors"
import type { MainStockUpdateReport } from "@/types/inventory-reports"
import type { Item } from "@/types/items"
import type { Vendor } from "@/types/vendors"

const columns: ReportTableColumn[] = [
  { key: "sl", header: "SL", align: "center", width: 28 },
  { key: "created_at", header: "Date" },
  { key: "item_name", header: "Item" },
  { key: "vendor_name", header: "Vendor" },
  { key: "quantity", header: "Quantity", align: "right" },
  { key: "unit_name", header: "Unit" },
  { key: "source_type", header: "Source" },
  { key: "reference", header: "Reference" },
]

const emptySummary = {
  entry_count: 0,
  item_count: 0,
  total_quantity: 0,
}

function buildRows(report: MainStockUpdateReport | null): ReportTableRow[] {
  if (!report) return []

  return report.items.map((item, index) => ({
    sl: index + 1,
    created_at: formatReportDateTime(item.created_at),
    item_name: item.item_name ?? "—",
    vendor_name: item.vendor_name ?? "—",
    quantity: formatQuantity(item.quantity),
    unit_name: item.unit_name ?? "—",
    source_type: formatSourceTypeLabel(item.source_type),
    reference: item.reference ?? "—",
  }))
}

export function MainStockUpdateReportClient() {
  const today = toInputDate()
  const monthStart = toInputDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const [fromDate, setFromDate] = React.useState(monthStart)
  const [toDate, setToDate] = React.useState(today)
  const [itemId, setItemId] = React.useState("")
  const [vendorId, setVendorId] = React.useState("")
  const [items, setItems] = React.useState<Item[]>([])
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [report, setReport] = React.useState<MainStockUpdateReport | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    void Promise.all([
      getItems({ limit: 500, sortBy: "name", sortOrder: "asc" }),
      getVendors({ limit: 200, sortBy: "vendor_name", sortOrder: "asc" }),
    ])
      .then(([itemsResult, vendorsResult]) => {
        setItems(itemsResult.data)
        setVendors(vendorsResult.data)
      })
      .catch(() => {
        setItems([])
        setVendors([])
      })
  }, [])

  const loadReport = React.useCallback(async () => {
    if (fromDate > toDate) {
      setError("From date must be on or before to date")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getMainStockUpdateReport(
        fromDate,
        toDate,
        itemId ? Number(itemId) : undefined,
        vendorId ? Number(vendorId) : undefined
      )
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load main stock update report"
      )
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, itemId, vendorId])

  React.useEffect(() => {
    void loadReport()
  }, [loadReport])

  const rows = buildRows(report)
  const summary = report?.summary ?? emptySummary

  const handleDownload = async () => {
    if (!report) return

    setDownloading(true)
    try {
      await downloadMainStockUpdateReport({
        title: "Main Stock Update History",
        subtitle: `${report.location_name} | ${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`,
        fileName: `main-stock-update-report-${report.from_date}-${report.to_date}.pdf`,
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
          Main Stock Update History
        </h1>
        <p className="text-[#8b95a5]">
          View all stock inflows at Main Warehouse including manual adds, PO
          receiving, transfers, and returns.
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
              Item
            </label>
            <select
              value={itemId}
              onChange={event => setItemId(event.target.value)}
              className={selectClassName}
            >
              <option value="">All items</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#373B44]">
              Vendor
            </label>
            <select
              value={vendorId}
              onChange={event => setVendorId(event.target.value)}
              className={selectClassName}
            >
              <option value="">All vendors</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.vendor_name}
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
            title="Main Stock Update History"
            subtitle={`${report.location_name} | ${formatReportDate(report.from_date)} to ${formatReportDate(report.to_date)}`}
          />
          <MainStockUpdateReportSummaryCards summary={summary} />
          <ReportDataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  )
}
