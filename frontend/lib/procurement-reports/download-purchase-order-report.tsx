import { pdf } from "@react-pdf/renderer"

import { PurchaseOrderReportDocument } from "@/components/procurement/reports/purchase-order-report-pdf"
import type { ReportTableColumn, ReportTableRow } from "@/components/procurement/reports/report-utils"
import { getCompanyLogoUrl } from "@/lib/company"
import type { PurchaseOrderReportSummary } from "@/types/purchase-order-reports"

type DownloadPurchaseOrderReportInput = {
  title: string
  subtitle: string
  fileName: string
  columns: ReportTableColumn[]
  rows: ReportTableRow[]
  summary: PurchaseOrderReportSummary
  showItemCount?: boolean
}

export async function downloadPurchaseOrderReport(
  input: DownloadPurchaseOrderReportInput
) {
  const generatedAt = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const blob = await pdf(
    <PurchaseOrderReportDocument
      title={input.title}
      subtitle={input.subtitle}
      generatedAt={generatedAt}
      logoUrl={getCompanyLogoUrl()}
      columns={input.columns}
      rows={input.rows}
      summary={input.summary}
      showItemCount={input.showItemCount}
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
