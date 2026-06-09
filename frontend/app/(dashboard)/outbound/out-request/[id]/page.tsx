import type { Metadata } from "next"
import { Suspense } from "react"

import { OutRequestDetailClient } from "@/components/out-requests/out-request-detail-client"

export const metadata: Metadata = { title: "Out Request Details" }

type OutRequestDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function OutRequestDetailPage({
  params,
}: OutRequestDetailPageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center text-[#8b95a5]">
          Loading out request details...
        </div>
      }
    >
      <OutRequestDetailClient outRequestId={Number(id)} />
    </Suspense>
  )
}
