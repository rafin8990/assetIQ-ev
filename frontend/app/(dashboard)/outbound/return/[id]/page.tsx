import type { Metadata } from "next"
import { Suspense } from "react"

import { ReturnDetailClient } from "@/components/returns/return-detail-client"

export const metadata: Metadata = { title: "Return Details" }

type ReturnDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function ReturnDetailPage({
  params,
}: ReturnDetailPageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center text-[#8b95a5]">
          Loading return details...
        </div>
      }
    >
      <ReturnDetailClient returnRequestId={Number(id)} />
    </Suspense>
  )
}
