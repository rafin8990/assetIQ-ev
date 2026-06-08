import type { Metadata } from "next"

import { RequisitionsPageClient } from "@/components/requisitions/requisitions-page-client"

export const metadata: Metadata = { title: "Requisitions" }

export default function RequisitionsPage() {
  return <RequisitionsPageClient />
}
