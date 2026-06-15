import type { Metadata } from "next"

import { MainStockUpdateReportClient } from "@/components/inventory/reports/main-stock-update-report-client"

export const metadata: Metadata = {
  title: "Main Stock Update History",
}

export default function MainStockUpdateReportPage() {
  return <MainStockUpdateReportClient />
}
