import type { Metadata } from "next"

import { DuePayReportClient } from "@/components/procurement/reports/due-pay-report-client"

export const metadata: Metadata = { title: "List of Due/Pay Report" }

export default function DuePayReportPage() {
  return <DuePayReportClient />
}
