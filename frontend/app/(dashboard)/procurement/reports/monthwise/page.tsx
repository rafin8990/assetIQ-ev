import type { Metadata } from "next"

import { MonthwiseReportClient } from "@/components/procurement/reports/monthwise-report-client"

export const metadata: Metadata = { title: "Monthwise Report" }

export default function MonthwiseReportPage() {
  return <MonthwiseReportClient />
}
