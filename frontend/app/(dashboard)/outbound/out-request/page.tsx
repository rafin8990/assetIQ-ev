import type { Metadata } from "next"

import { OutRequestsPageClient } from "@/components/out-requests/out-requests-page-client"

export const metadata: Metadata = { title: "Out Request" }

export default function OutRequestPage() {
  return <OutRequestsPageClient />
}
