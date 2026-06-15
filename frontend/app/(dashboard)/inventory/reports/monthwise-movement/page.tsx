import type { Metadata } from "next"

import { MonthwiseMovementReportClient } from "@/components/inventory/reports/monthwise-movement-report-client"

export const metadata: Metadata = {
  title: "Monthly Movement Report",
}

export default function MonthwiseMovementReportPage() {
  return <MonthwiseMovementReportClient />
}
