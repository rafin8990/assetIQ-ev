import { pdf } from "@react-pdf/renderer"

import type {
  ReportTableColumn,
  ReportTableRow,
} from "@/components/procurement/reports/report-utils"
import { ReturnReportDocument } from "@/components/outbound/reports/return-report-pdf"
import { getCompanyLogoUrl } from "@/lib/company"
import type { ReturnReportSummary } from "@/types/return-reports"

type DownloadReturnReportInput = {
  title: string
  subtitle: string
  fileName: string
  columns: ReportTableColumn[]
  rows: ReportTableRow[]
  summary: ReturnReportSummary
}

export async function downloadReturnReport(input: DownloadReturnReportInput) {
  const generatedAt = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const blob = await pdf(
    <ReturnReportDocument
      title={input.title}
      subtitle={input.subtitle}
      generatedAt={generatedAt}
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
