import type { Metadata } from "next"

import { UnitsPageClient } from "@/components/units/units-page-client"

export const metadata: Metadata = { title: "Units" }

export default function UnitsPage() {
  return <UnitsPageClient />
}
