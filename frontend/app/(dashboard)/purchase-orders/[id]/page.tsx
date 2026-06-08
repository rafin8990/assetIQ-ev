import type { Metadata } from "next"
import { Suspense } from "react"

import { PurchaseOrderDetailClient } from "@/components/purchase-orders/purchase-order-detail-client"

export const metadata: Metadata = { title: "Purchase Order Details" }

type PurchaseOrderDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function PurchaseOrderDetailPage({
  params,
}: PurchaseOrderDetailPageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center text-[#8b95a5]">
          Loading purchase order details...
        </div>
      }
    >
      <PurchaseOrderDetailClient purchaseOrderId={Number(id)} />
    </Suspense>
  )
}
