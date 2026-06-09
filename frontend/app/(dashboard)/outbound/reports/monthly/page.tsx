import type { Metadata } from "next"

import { MonthwiseReportClient } from "@/components/outbound/reports/monthwise-report-client"

export const metadata: Metadata = { title: "Monthly Out Request Report" }

export default function MonthlyOutRequestReportPage() {
  return <MonthwiseReportClient />
}
