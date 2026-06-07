import type { Metadata } from "next"

import { CategoriesPageClient } from "@/components/categories/categories-page-client"

export const metadata: Metadata = { title: "Category" }

export default function CategoryPage() {
  return <CategoriesPageClient />
}
