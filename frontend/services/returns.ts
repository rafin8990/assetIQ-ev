import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateReturnRequestPayload,
  ReturnRequest,
  ReturnRequestsListParams,
  UpdateReturnRequestPayload,
} from "@/types/returns"

function buildQuery(params: ReturnRequestsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.status) search.set("status", params.status)
  if (params.requestedBy) search.set("requestedBy", String(params.requestedBy))
  if (params.outRequestId)
    search.set("outRequestId", String(params.outRequestId))

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getReturnRequests(params: ReturnRequestsListParams = {}) {
  const response = await apiRequest<ReturnRequest[]>(
    `/return-requests${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getReturnRequest(id: number) {
  const response = await apiRequest<ReturnRequest>(`/return-requests/${id}`)
  return response.data as ReturnRequest
}

export async function createReturnRequest(payload: CreateReturnRequestPayload) {
  const response = await apiRequest<ReturnRequest>("/return-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return response.data as ReturnRequest
}

export async function updateReturnRequest(
  id: number,
  payload: UpdateReturnRequestPayload
) {
  const response = await apiRequest<ReturnRequest>(`/return-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return response.data as ReturnRequest
}

export async function deleteReturnRequest(id: number) {
  await apiRequest(`/return-requests/${id}`, { method: "DELETE" })
}

export async function approveReturnRequest(id: number) {
  const response = await apiRequest<ReturnRequest>(
    `/return-requests/${id}/approve`,
    { method: "PATCH" }
  )
  return response.data as ReturnRequest
}

export async function cancelReturnRequest(id: number) {
  const response = await apiRequest<ReturnRequest>(
    `/return-requests/${id}/cancel`,
    { method: "PATCH" }
  )
  return response.data as ReturnRequest
}
