import type { Metadata } from "next"
import { Package } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Pick slips" }

export default function PickSlipsPage() {
  return (
    <PagePlaceholder
      title="Pick slips"
      description="Manage pick slips and fulfillment orders."
      icon={Package}
    />
  )
}
