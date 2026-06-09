import type { Metadata } from "next"

import { ReturnsPageClient } from "@/components/returns/returns-page-client"

export const metadata: Metadata = { title: "Return" }

export default function ReturnPage() {
  return <ReturnsPageClient />
}
