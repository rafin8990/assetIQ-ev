import { apiFormRequest, apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateVendorPayload,
  UpdateVendorPayload,
  Vendor,
  VendorsListParams,
} from "@/types/vendors"

function buildQuery(params: VendorsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)

  const query = search.toString()
  return query ? `?${query}` : ""
}

function appendVendorToFormData(
  formData: FormData,
  payload: CreateVendorPayload | UpdateVendorPayload
) {
  if ("vendor_name" in payload && payload.vendor_name !== undefined) {
    formData.append("vendor_name", payload.vendor_name)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "company_name")) {
    formData.append("company_name", payload.company_name ?? "")
  }

  if (Object.prototype.hasOwnProperty.call(payload, "mobile_number")) {
    formData.append("mobile_number", payload.mobile_number ?? "")
  }

  if (Object.prototype.hasOwnProperty.call(payload, "email")) {
    formData.append("email", payload.email ?? "")
  }
}

export async function getVendors(params: VendorsListParams = {}) {
  const response = await apiRequest<Vendor[]>(`/vendors${buildQuery(params)}`)

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getVendor(id: number) {
  const response = await apiRequest<Vendor>(`/vendors/${id}`)
  return response.data as Vendor
}

export async function createVendor(
  payload: CreateVendorPayload,
  image?: File | null
) {
  const formData = new FormData()
  appendVendorToFormData(formData, payload)

  if (image) {
    formData.append("image", image)
  }

  const response = await apiFormRequest<Vendor>("/vendors", formData)
  return response.data as Vendor
}

export async function updateVendor(
  id: number,
  payload: UpdateVendorPayload,
  image?: File | null
) {
  const formData = new FormData()
  appendVendorToFormData(formData, payload)

  if (image) {
    formData.append("image", image)
  }

  const response = await apiFormRequest<Vendor>(
    `/vendors/${id}`,
    formData,
    "PATCH"
  )

  return response.data as Vendor
}

export async function deleteVendor(id: number) {
  await apiRequest(`/vendors/${id}`, { method: "DELETE" })
}
