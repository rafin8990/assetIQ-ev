import type { Metadata } from "next"
import { MapPin } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Location Tracker Status" }

export default function LocationTrackerStatusPage() {
  return (
    <PagePlaceholder
      title="Location Tracker Status"
      description="View real-time location tracker status and updates."
      icon={MapPin}
    />
  )
}
