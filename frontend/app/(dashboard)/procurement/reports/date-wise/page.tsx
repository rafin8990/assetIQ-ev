import type { Metadata } from "next"

import { DateWiseReportClient } from "@/components/procurement/reports/date-wise-report-client"

export const metadata: Metadata = { title: "Date Wise Report" }

export default function DateWiseReportPage() {
  return <DateWiseReportClient />
}
