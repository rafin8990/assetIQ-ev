import type { Metadata } from "next"

import { StockMovementsPageClient } from "@/components/stock-movements/stock-movements-page-client"

export const metadata: Metadata = { title: "Stock Movements" }

export default function StockMovementsPage() {
  return <StockMovementsPageClient />
}
