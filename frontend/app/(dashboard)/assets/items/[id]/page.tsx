import type { Metadata } from "next"

import { ItemDetailClient } from "@/components/items/item-detail-client"

export const metadata: Metadata = { title: "Item Details" }

type ItemDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params

  return <ItemDetailClient itemId={Number(id)} />
}
