import type { Metadata } from "next"
import { Send } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Out Request" }

export default function OutRequestPage() {
  return (
    <PagePlaceholder
      title="Out Request"
      description="Create and manage outbound material requests."
      icon={Send}
    />
  )
}
