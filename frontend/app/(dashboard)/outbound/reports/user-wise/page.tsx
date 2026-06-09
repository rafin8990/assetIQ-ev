import type { Metadata } from "next"

import { UserWiseReportClient } from "@/components/outbound/reports/user-wise-report-client"

export const metadata: Metadata = { title: "User Wise Out Request Report" }

export default function UserWiseOutRequestReportPage() {
  return <UserWiseReportClient />
}
