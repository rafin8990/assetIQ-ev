import type { Metadata } from "next"

import { DailyReportClient } from "@/components/procurement/reports/daily-report-client"

export const metadata: Metadata = { title: "Today's Purchase Order Report" }

export default function TodaysPurchaseOrderReportPage() {
  return <DailyReportClient />
}
