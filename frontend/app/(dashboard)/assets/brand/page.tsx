import type { Metadata } from "next"

import { BrandsPageClient } from "@/components/brands/brands-page-client"

export const metadata: Metadata = { title: "Brand" }

export default function BrandPage() {
  return <BrandsPageClient />
}
