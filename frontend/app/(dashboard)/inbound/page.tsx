import type { Metadata } from "next"
import { Archive } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Inbound" }

export default function InboundPage() {
  return (
    <PagePlaceholder
      title="Inbound"
      description="Monitor inbound shipments and receiving."
      icon={Archive}
    />
  )
}
