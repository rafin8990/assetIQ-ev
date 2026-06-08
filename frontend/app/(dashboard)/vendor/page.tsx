import type { Metadata } from "next"

import { VendorsPageClient } from "@/components/vendors/vendors-page-client"

export const metadata: Metadata = { title: "Vendors" }

export default function VendorPage() {
  return <VendorsPageClient />
}
