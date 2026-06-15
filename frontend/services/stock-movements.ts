import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateStockMovementPayload,
  StockMovement,
  StockMovementActionPayload,
  StockMovementsListParams,
} from "@/types/stock-movements"

function buildQuery(params: StockMovementsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.status) search.set("status", params.status)
  if (params.sourceLocationId) {
    search.set("sourceLocationId", String(params.sourceLocationId))
  }
  if (params.destinationLocationId) {
    search.set("destinationLocationId", String(params.destinationLocationId))
  }

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getStockMovements(params: StockMovementsListParams = {}) {
  const response = await apiRequest<StockMovement[]>(
    `/stock-movements${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getStockMovement(id: number) {
  const response = await apiRequest<StockMovement>(`/stock-movements/${id}`)
  return response.data as StockMovement
}

export async function createStockMovement(payload: CreateStockMovementPayload) {
  const response = await apiRequest<StockMovement>("/stock-movements", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as StockMovement
}

export async function approveStockMovement(
  id: number,
  payload: StockMovementActionPayload = {}
) {
  const response = await apiRequest<StockMovement>(
    `/stock-movements/${id}/approve`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )

  return response.data as StockMovement
}

export async function readyStockMovement(
  id: number,
  payload: StockMovementActionPayload = {}
) {
  const response = await apiRequest<StockMovement>(
    `/stock-movements/${id}/ready`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )

  return response.data as StockMovement
}

export async function transferStockMovement(
  id: number,
  payload: StockMovementActionPayload = {}
) {
  const response = await apiRequest<StockMovement>(
    `/stock-movements/${id}/transfer`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )

  return response.data as StockMovement
}

export async function confirmStockMovement(
  id: number,
  payload: StockMovementActionPayload = {}
) {
  const response = await apiRequest<StockMovement>(
    `/stock-movements/${id}/confirm`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )

  return response.data as StockMovement
}

export async function cancelStockMovement(id: number) {
  const response = await apiRequest<StockMovement>(
    `/stock-movements/${id}/cancel`,
    { method: "PATCH" }
  )

  return response.data as StockMovement
}
