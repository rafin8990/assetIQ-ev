import type { Metadata } from "next"
import { Truck } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Request Outbound" }

export default function RequestOutboundPage() {
  return (
    <PagePlaceholder
      title="Request Outbound"
      description="Process approved requests for outbound dispatch."
      icon={Truck}
    />
  )
}
