import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateManualLotPayload,
  InventoryListParams,
  LocationStockRow,
  StockLot,
  TotalStockLocationBreakdown,
  TotalStockRow,
} from "@/types/inventory"

function buildQuery(params: InventoryListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.locationId) search.set("locationId", String(params.locationId))
  if (params.itemId) search.set("itemId", String(params.itemId))
  if (params.vendorId) search.set("vendorId", String(params.vendorId))

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getLocationStock(params: InventoryListParams = {}) {
  const response = await apiRequest<LocationStockRow[]>(
    `/inventory/location-stock${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getTotalStock(params: InventoryListParams = {}) {
  const response = await apiRequest<TotalStockRow[]>(
    `/inventory/total-stock${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getStockLots(params: InventoryListParams = {}) {
  const response = await apiRequest<StockLot[]>(
    `/inventory/lots${buildQuery(params)}`
  )

  return response.data ?? []
}

export async function getTotalStockBreakdown(
  itemId: number,
  vendorId?: number | null
) {
  const search = new URLSearchParams()
  if (vendorId !== undefined) {
    search.set("vendorId", vendorId === null ? "null" : String(vendorId))
  }

  const query = search.toString()
  const response = await apiRequest<TotalStockLocationBreakdown[]>(
    `/inventory/total-stock/${itemId}/breakdown${query ? `?${query}` : ""}`
  )

  return response.data ?? []
}

export async function addManualLot(payload: CreateManualLotPayload) {
  const response = await apiRequest<StockLot>("/inventory/manual-lot", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as StockLot
}
