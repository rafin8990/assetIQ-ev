import { pdf } from "@react-pdf/renderer"

import {
  buildMovementSummaryCards,
  InventoryMovementReportDocument,
  MainStockUpdateReportDocument,
} from "@/components/inventory/reports/inventory-report-pdf"
import type { ReportTableColumn, ReportTableRow } from "@/components/procurement/reports/report-utils"
import { getCompanyLogoUrl } from "@/lib/company"
import type {
  InventoryMovementReportSummary,
  MainStockUpdateReportSummary,
} from "@/types/inventory-reports"

type DownloadInventoryMovementReportInput = {
  title: string
  subtitle: string
  fileName: string
  columns: ReportTableColumn[]
  rows: ReportTableRow[]
  summary: InventoryMovementReportSummary
  showItemCount?: boolean
}

type DownloadMainStockUpdateReportInput = {
  title: string
  subtitle: string
  fileName: string
  columns: ReportTableColumn[]
  rows: ReportTableRow[]
  summary: MainStockUpdateReportSummary
}

function getGeneratedAt() {
  return new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export async function downloadInventoryMovementReport(
  input: DownloadInventoryMovementReportInput
) {
  const blob = await pdf(
    <InventoryMovementReportDocument
      title={input.title}
      subtitle={input.subtitle}
      generatedAt={getGeneratedAt()}
      logoUrl={getCompanyLogoUrl()}
      columns={input.columns}
      rows={input.rows}
      summaryCards={buildMovementSummaryCards(
        input.summary,
        input.showItemCount
      )}
    />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = input.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function downloadMainStockUpdateReport(
  input: DownloadMainStockUpdateReportInput
) {
  const blob = await pdf(
    <MainStockUpdateReportDocument
      title={input.title}
      subtitle={input.subtitle}
      generatedAt={getGeneratedAt()}
      logoUrl={getCompanyLogoUrl()}
      columns={input.columns}
      rows={input.rows}
      summary={input.summary}
    />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = input.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
