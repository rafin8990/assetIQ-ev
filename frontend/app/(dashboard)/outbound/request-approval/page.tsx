import type { Metadata } from "next"
import { CheckCircle2 } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Request Approval" }

export default function RequestApprovalPage() {
  return (
    <PagePlaceholder
      title="Request Approval"
      description="Review and approve outbound requests."
      icon={CheckCircle2}
    />
  )
}
