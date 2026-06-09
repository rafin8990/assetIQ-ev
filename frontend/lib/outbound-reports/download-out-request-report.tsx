import { pdf } from "@react-pdf/renderer"

import type { ReportTableColumn, ReportTableRow } from "@/components/procurement/reports/report-utils"
import { OutRequestReportDocument } from "@/components/outbound/reports/out-request-report-pdf"
import { getCompanyLogoUrl } from "@/lib/company"
import type { OutRequestReportSummary } from "@/types/out-request-reports"

type DownloadOutRequestReportInput = {
  title: string
  subtitle: string
  fileName: string
  columns: ReportTableColumn[]
  rows: ReportTableRow[]
  summary: OutRequestReportSummary
  showItemCount?: boolean
}

export async function downloadOutRequestReport(
  input: DownloadOutRequestReportInput
) {
  const generatedAt = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const blob = await pdf(
    <OutRequestReportDocument
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
