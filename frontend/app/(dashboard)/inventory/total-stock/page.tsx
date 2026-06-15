import type { Metadata } from "next"

import { TotalStockPageClient } from "@/components/inventory/total-stock-page-client"

export const metadata: Metadata = { title: "Total Stock" }

export default function TotalStockPage() {
  return <TotalStockPageClient />
}
