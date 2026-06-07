import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CategoriesListParams,
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/types/categories"

function buildQuery(params: CategoriesListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getCategories(params: CategoriesListParams = {}) {
  const response = await apiRequest<Category[]>(
    `/categories${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function createCategory(payload: CreateCategoryPayload) {
  const response = await apiRequest<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as Category
}

export async function updateCategory(
  id: number,
  payload: UpdateCategoryPayload
) {
  const response = await apiRequest<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data as Category
}

export async function deleteCategory(id: number) {
  const response = await apiRequest<Category>(`/categories/${id}`, {
    method: "DELETE",
  })

  return response.data as Category
}
