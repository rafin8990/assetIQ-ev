import type { Metadata } from "next"

import { DateWiseMovementReportClient } from "@/components/inventory/reports/date-wise-movement-report-client"

export const metadata: Metadata = {
  title: "Date-wise Movement History",
}

export default function DateWiseMovementReportPage() {
  return <DateWiseMovementReportClient />
}
