import type { Metadata } from "next"

import { DailyReportClient } from "@/components/outbound/reports/daily-report-client"

export const metadata: Metadata = { title: "Today's Out Request Report" }

export default function TodaysOutRequestReportPage() {
  return <DailyReportClient />
}
