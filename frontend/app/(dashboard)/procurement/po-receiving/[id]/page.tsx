import type { Metadata } from "next"
import { Suspense } from "react"

import { PoReceivingDetailClient } from "@/components/purchase-orders/po-receiving-detail-client"

export const metadata: Metadata = { title: "PO Receiving Detail" }

type PoReceivingDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function PoReceivingDetailPage({
  params,
}: PoReceivingDetailPageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center text-[#8b95a5]">
          Loading receiving details...
        </div>
      }
    >
      <PoReceivingDetailClient purchaseOrderId={Number(id)} />
    </Suspense>
  )
}
