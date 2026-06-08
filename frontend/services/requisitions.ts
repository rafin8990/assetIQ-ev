import { apiFormRequest, apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateRequisitionPayload,
  Requisition,
  RequisitionsListParams,
  UpdateRequisitionPayload,
} from "@/types/requisitions"

function buildQuery(params: RequisitionsListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.status) search.set("status", params.status)
  if (params.createdBy) search.set("createdBy", String(params.createdBy))

  const query = search.toString()
  return query ? `?${query}` : ""
}

function appendRequisitionToFormData(
  formData: FormData,
  payload: CreateRequisitionPayload | UpdateRequisitionPayload
) {
  if (payload.description !== undefined) {
    formData.append("description", payload.description ?? "")
  }

  if ("created_by" in payload && payload.created_by !== undefined) {
    formData.append("created_by", String(payload.created_by))
  }

  if (Object.prototype.hasOwnProperty.call(payload, "approved_by")) {
    formData.append(
      "approved_by",
      payload.approved_by === null || payload.approved_by === undefined
        ? ""
        : String(payload.approved_by)
    )
  }

  if (payload.status !== undefined) {
    formData.append("status", payload.status)
  }

  if (payload.items) {
    formData.append("items", JSON.stringify(payload.items))
  }
}

export async function getRequisitions(params: RequisitionsListParams = {}) {
  const response = await apiRequest<Requisition[]>(
    `/requisitions${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getRequisition(id: number) {
  const response = await apiRequest<Requisition>(`/requisitions/${id}`)
  return response.data as Requisition
}

export async function createRequisition(
  payload: CreateRequisitionPayload,
  attachment?: File | null
) {
  const formData = new FormData()
  appendRequisitionToFormData(formData, payload)

  if (attachment) {
    formData.append("attachment", attachment)
  }

  const response = await apiFormRequest<Requisition>("/requisitions", formData)
  return response.data as Requisition
}

export async function updateRequisition(
  id: number,
  payload: UpdateRequisitionPayload,
  attachment?: File | null
) {
  const formData = new FormData()
  appendRequisitionToFormData(formData, payload)

  if (attachment) {
    formData.append("attachment", attachment)
  }

  const response = await apiFormRequest<Requisition>(
    `/requisitions/${id}`,
    formData,
    "PATCH"
  )

  return response.data as Requisition
}

export async function deleteRequisition(id: number) {
  await apiRequest(`/requisitions/${id}`, { method: "DELETE" })
}

export async function approveRequisition(id: number, approvedBy: number) {
  return updateRequisition(id, {
    status: "approved",
    approved_by: approvedBy,
  })
}

export async function cancelRequisition(id: number) {
  return updateRequisition(id, { status: "cancelled" })
}
