import type { Metadata } from "next"

import { StocksPageClient } from "@/components/stocks/stocks-page-client"

export const metadata: Metadata = { title: "Stock" }

export default function StockPage() {
  return <StocksPageClient />
}
