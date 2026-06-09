import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateOutRequestPayload,
  OutRequest,
  OutRequestsListParams,
  ProcessOutRequestPayload,
  UpdateOutRequestPayload,
} from "@/types/out-requests"

function buildQuery(params: OutRequestsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.status) search.set("status", params.status)
  if (params.requestedBy) search.set("requestedBy", String(params.requestedBy))

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getOutRequests(params: OutRequestsListParams = {}) {
  const response = await apiRequest<OutRequest[]>(
    `/out-requests${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getOutRequest(id: number) {
  const response = await apiRequest<OutRequest>(`/out-requests/${id}`)
  return response.data as OutRequest
}

export async function createOutRequest(payload: CreateOutRequestPayload) {
  const response = await apiRequest<OutRequest>("/out-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return response.data as OutRequest
}

export async function updateOutRequest(
  id: number,
  payload: UpdateOutRequestPayload
) {
  const response = await apiRequest<OutRequest>(`/out-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return response.data as OutRequest
}

export async function deleteOutRequest(id: number) {
  await apiRequest(`/out-requests/${id}`, { method: "DELETE" })
}

export async function approveOutRequest(id: number) {
  const response = await apiRequest<OutRequest>(`/out-requests/${id}/approve`, {
    method: "PATCH",
  })
  return response.data as OutRequest
}

export async function cancelOutRequest(id: number) {
  const response = await apiRequest<OutRequest>(`/out-requests/${id}/cancel`, {
    method: "PATCH",
  })
  return response.data as OutRequest
}

export async function processOutRequest(
  id: number,
  payload: ProcessOutRequestPayload
) {
  const response = await apiRequest<OutRequest>(`/out-requests/${id}/out`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return response.data as OutRequest
}
