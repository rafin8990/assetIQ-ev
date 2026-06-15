import type { Metadata } from "next"

import { StockMovementDetailClient } from "@/components/stock-movements/stock-movement-detail-client"

export const metadata: Metadata = { title: "Stock Movement Detail" }

type Props = {
  params: Promise<{ id: string }>
}

export default async function StockMovementDetailPage({ params }: Props) {
  const { id } = await params
  return <StockMovementDetailClient movementId={Number(id)} />
}
