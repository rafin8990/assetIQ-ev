import type { Metadata } from "next"

import { ReturnReportClient } from "@/components/outbound/reports/return-report-client"

export const metadata: Metadata = { title: "Return Report" }

export default function ReturnReportPage() {
  return <ReturnReportClient />
}
