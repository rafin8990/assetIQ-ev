import type { Metadata } from "next"

import { AnalyticsPageClient } from "@/components/dashboard/analytics-page-client"

export const metadata: Metadata = {
  title: "Analytics",
}

export default function AnalyticsPage() {
  return <AnalyticsPageClient />
}
