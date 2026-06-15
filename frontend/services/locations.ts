import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateLocationPayload,
  Location,
  LocationsListParams,
  UpdateLocationPayload,
} from "@/types/locations"

function buildQuery(params: LocationsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getLocations(params: LocationsListParams = {}) {
  const response = await apiRequest<Location[]>(`/locations${buildQuery(params)}`)

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function createLocation(payload: CreateLocationPayload) {
  const response = await apiRequest<Location>("/locations", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as Location
}

export async function updateLocation(id: number, payload: UpdateLocationPayload) {
  const response = await apiRequest<Location>(`/locations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data as Location
}

export async function deleteLocation(id: number) {
  const response = await apiRequest<Location>(`/locations/${id}`, {
    method: "DELETE",
  })

  return response.data as Location
}
