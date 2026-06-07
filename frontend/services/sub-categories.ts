import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateSubCategoryPayload,
  SubCategoriesListParams,
  SubCategory,
  UpdateSubCategoryPayload,
} from "@/types/sub-categories"

function buildQuery(params: SubCategoriesListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.categoryId) search.set("categoryId", String(params.categoryId))

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getSubCategories(params: SubCategoriesListParams = {}) {
  const response = await apiRequest<SubCategory[]>(
    `/sub-categories${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function createSubCategory(payload: CreateSubCategoryPayload) {
  const response = await apiRequest<SubCategory>("/sub-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as SubCategory
}

export async function updateSubCategory(
  id: number,
  payload: UpdateSubCategoryPayload
) {
  const response = await apiRequest<SubCategory>(`/sub-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data as SubCategory
}

export async function deleteSubCategory(id: number) {
  const response = await apiRequest<SubCategory>(`/sub-categories/${id}`, {
    method: "DELETE",
  })

  return response.data as SubCategory
}
