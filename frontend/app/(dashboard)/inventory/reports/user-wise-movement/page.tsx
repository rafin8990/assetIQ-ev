import type { Metadata } from "next"

import { UserWiseMovementReportClient } from "@/components/inventory/reports/user-wise-movement-report-client"

export const metadata: Metadata = {
  title: "User-wise Movement History",
}

export default function UserWiseMovementReportPage() {
  return <UserWiseMovementReportClient />
}
