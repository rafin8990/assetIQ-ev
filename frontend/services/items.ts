import {
  apiFormRequest,
  apiRequest,
  downloadFile,
} from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  BulkImportResult,
  CreateItemPayload,
  Item,
  ItemsListParams,
  UpdateItemPayload,
} from "@/types/items"

function buildQuery(params: ItemsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.categoryId) search.set("categoryId", String(params.categoryId))
  if (params.subCategoryId)
    search.set("subCategoryId", String(params.subCategoryId))
  if (params.brandId) search.set("brandId", String(params.brandId))

  const query = search.toString()
  return query ? `?${query}` : ""
}

function appendPayloadToFormData(
  formData: FormData,
  payload: CreateItemPayload | UpdateItemPayload
) {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return
    if (value === null) {
      formData.append(key, "")
      return
    }
    formData.append(key, String(value))
  })
}

export async function getItems(params: ItemsListParams = {}) {
  const response = await apiRequest<Item[]>(`/items${buildQuery(params)}`)

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getItem(id: number) {
  const response = await apiRequest<Item>(`/items/${id}`)
  return response.data as Item
}

export async function createItem(
  payload: CreateItemPayload,
  images: File[] = []
) {
  const formData = new FormData()
  appendPayloadToFormData(formData, payload)
  images.forEach(file => formData.append("images", file))

  const response = await apiFormRequest<Item>("/items", formData)
  return response.data as Item
}

export async function updateItem(id: number, payload: UpdateItemPayload) {
  const response = await apiRequest<Item>(`/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data as Item
}

export async function deleteItem(id: number) {
  await apiRequest(`/items/${id}`, { method: "DELETE" })
}

export async function addItemImages(id: number, images: File[]) {
  const formData = new FormData()
  images.forEach(file => formData.append("images", file))

  const response = await apiFormRequest<Item>(`/items/${id}/images`, formData)
  return response.data as Item
}

export async function deleteItemImage(itemId: number, imageId: number) {
  const response = await apiRequest<Item>(
    `/items/${itemId}/images/${imageId}`,
    { method: "DELETE" }
  )

  return response.data as Item
}

export async function bulkImportItems(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await apiFormRequest<BulkImportResult>(
    "/items/bulk-import",
    formData
  )

  return response.data as BulkImportResult
}

export async function downloadItemsImportTemplate() {
  await downloadFile(
    "/items/bulk-import/template",
    "items-import-template.xlsx"
  )
}
