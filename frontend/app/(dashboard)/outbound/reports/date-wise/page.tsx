import type { Metadata } from "next"

import { DateWiseReportClient } from "@/components/outbound/reports/date-wise-report-client"

export const metadata: Metadata = { title: "Date Wise Out Request Report" }

export default function DateWiseOutRequestReportPage() {
  return <DateWiseReportClient />
}
