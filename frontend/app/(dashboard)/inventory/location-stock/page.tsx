import type { Metadata } from "next"

import { LocationStockPageClient } from "@/components/inventory/location-stock-page-client"

export const metadata: Metadata = { title: "Location Stock" }

export default function LocationStockPage() {
  return <LocationStockPageClient />
}
