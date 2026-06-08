import type { Metadata } from "next"
import { Suspense } from "react"

import { RequisitionDetailClient } from "@/components/requisitions/requisition-detail-client"

export const metadata: Metadata = { title: "Requisition Details" }

type RequisitionDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function RequisitionDetailPage({
  params,
}: RequisitionDetailPageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center text-[#8b95a5]">
          Loading requisition details...
        </div>
      }
    >
      <RequisitionDetailClient requisitionId={Number(id)} />
    </Suspense>
  )
}
