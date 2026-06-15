import type { Metadata } from "next"

import { DateRangeMovementReportClient } from "@/components/inventory/reports/date-range-movement-report-client"

export const metadata: Metadata = {
  title: "Date Range Movement History",
}

export default function DateRangeMovementReportPage() {
  return <DateRangeMovementReportClient />
}
