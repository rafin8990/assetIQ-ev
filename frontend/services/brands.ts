import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  Brand,
  BrandsListParams,
  CreateBrandPayload,
  UpdateBrandPayload,
} from "@/types/brands"

function buildQuery(params: BrandsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getBrands(params: BrandsListParams = {}) {
  const response = await apiRequest<Brand[]>(`/brands${buildQuery(params)}`)

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function createBrand(payload: CreateBrandPayload) {
  const response = await apiRequest<Brand>("/brands", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as Brand
}

export async function updateBrand(id: number, payload: UpdateBrandPayload) {
  const response = await apiRequest<Brand>(`/brands/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data as Brand
}

export async function deleteBrand(id: number) {
  const response = await apiRequest<Brand>(`/brands/${id}`, {
    method: "DELETE",
  })

  return response.data as Brand
}
