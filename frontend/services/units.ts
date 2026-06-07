import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateUnitPayload,
  Unit,
  UnitsListParams,
  UpdateUnitPayload,
} from "@/types/units"

function buildQuery(params: UnitsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getUnits(params: UnitsListParams = {}) {
  const response = await apiRequest<Unit[]>(`/units${buildQuery(params)}`)

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function createUnit(payload: CreateUnitPayload) {
  const response = await apiRequest<Unit>("/units", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as Unit
}

export async function updateUnit(id: number, payload: UpdateUnitPayload) {
  const response = await apiRequest<Unit>(`/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data as Unit
}

export async function deleteUnit(id: number) {
  const response = await apiRequest<Unit>(`/units/${id}`, {
    method: "DELETE",
  })

  return response.data as Unit
}
