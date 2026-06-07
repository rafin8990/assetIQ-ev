import type { Metadata } from "next"

import { SubCategoriesPageClient } from "@/components/sub-categories/sub-categories-page-client"

export const metadata: Metadata = { title: "Sub category" }

export default function SubCategoryPage() {
  return <SubCategoriesPageClient />
}
