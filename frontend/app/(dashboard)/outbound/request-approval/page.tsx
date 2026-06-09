import type { Metadata } from "next"

import { RequestApprovalPageClient } from "@/components/out-requests/request-approval-page-client"

export const metadata: Metadata = { title: "Request Approval" }

export default function RequestApprovalPage() {
  return <RequestApprovalPageClient />
}
