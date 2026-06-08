import {
  apiFormRequest,
  apiRequest,
  downloadFile,
} from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  BulkStockImportResult,
  CreateManualStockPayload,
  Stock,
  StocksListParams,
  UpdateStockPayload,
} from "@/types/stocks"

function buildQuery(params: StocksListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.itemId) search.set("itemId", String(params.itemId))

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getStocks(params: StocksListParams = {}) {
  const response = await apiRequest<Stock[]>(`/stocks${buildQuery(params)}`)

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getStock(id: number) {
  const response = await apiRequest<Stock>(`/stocks/${id}`)
  return response.data as Stock
}

export async function addManualStock(payload: CreateManualStockPayload) {
  const response = await apiRequest<Stock>("/stocks/manual", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as Stock
}

export async function bulkImportStock(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await apiFormRequest<BulkStockImportResult>(
    "/stocks/bulk-import",
    formData
  )

  return response.data as BulkStockImportResult
}

export async function downloadStockImportTemplate() {
  await downloadFile(
    "/stocks/bulk-import/template",
    "stock-import-template.xlsx"
  )
}

export async function updateStock(id: number, payload: UpdateStockPayload) {
  const response = await apiRequest<Stock>(`/stocks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data as Stock
}

export async function deleteStock(id: number) {
  await apiRequest(`/stocks/${id}`, { method: "DELETE" })
}
