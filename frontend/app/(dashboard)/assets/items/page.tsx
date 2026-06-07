import type { Metadata } from "next"

import { ItemsPageClient } from "@/components/items/items-page-client"

export const metadata: Metadata = { title: "Items" }

export default function AssetItemsPage() {
  return <ItemsPageClient />
}
