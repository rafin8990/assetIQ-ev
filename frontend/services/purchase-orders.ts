import { apiFormRequest, apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  StagingAcceptItemPayload,
  StagingPurchaseOrder,
  StagingPurchaseOrdersListParams,
  StagingReceiptItemPayload,
  VendorReturnItemPayload,
} from "@/types/purchase-order-staging"
import type {
  CreatePurchaseOrderPayload,
  PurchaseOrder,
  PurchaseOrdersListParams,
  UpdatePurchaseOrderPayload,
} from "@/types/purchase-orders"

function buildQuery(params: PurchaseOrdersListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.status) search.set("status", params.status)
  if (params.orderType) search.set("orderType", params.orderType)
  if (params.createdBy) search.set("createdBy", String(params.createdBy))
  if (params.vendorId) search.set("vendorId", String(params.vendorId))

  const query = search.toString()
  return query ? `?${query}` : ""
}

function appendPurchaseOrderToFormData(
  formData: FormData,
  payload: CreatePurchaseOrderPayload | UpdatePurchaseOrderPayload
) {
  if ("created_by" in payload && payload.created_by !== undefined) {
    formData.append("created_by", String(payload.created_by))
  }

  if (payload.description !== undefined) {
    formData.append("description", payload.description ?? "")
  }

  if (payload.status !== undefined) {
    formData.append("status", payload.status)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "paid_amount")) {
    formData.append(
      "paid_amount",
      payload.paid_amount === null || payload.paid_amount === undefined
        ? ""
        : String(payload.paid_amount)
    )
  }

  if (Object.prototype.hasOwnProperty.call(payload, "discount_amount")) {
    formData.append(
      "discount_amount",
      payload.discount_amount === null || payload.discount_amount === undefined
        ? ""
        : String(payload.discount_amount)
    )
  }

  if (Object.prototype.hasOwnProperty.call(payload, "vendor_id")) {
    formData.append(
      "vendor_id",
      payload.vendor_id === null || payload.vendor_id === undefined
        ? ""
        : String(payload.vendor_id)
    )
  }

  if (payload.order_type !== undefined) {
    formData.append("order_type", payload.order_type)
  }

  if (payload.items) {
    formData.append("items", JSON.stringify(payload.items))
  }

  if (
    "requisition_ids" in payload &&
    payload.requisition_ids &&
    payload.requisition_ids.length
  ) {
    formData.append("requisition_ids", JSON.stringify(payload.requisition_ids))
  }
}

export async function getPurchaseOrders(params: PurchaseOrdersListParams = {}) {
  const response = await apiRequest<PurchaseOrder[]>(
    `/purchase-orders${buildQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getPurchaseOrder(id: number) {
  const response = await apiRequest<PurchaseOrder>(`/purchase-orders/${id}`)
  return response.data as PurchaseOrder
}

export async function createPurchaseOrder(
  payload: CreatePurchaseOrderPayload,
  attachment?: File | null
) {
  const formData = new FormData()
  appendPurchaseOrderToFormData(formData, payload)

  if (attachment) {
    formData.append("attachment", attachment)
  }

  const response = await apiFormRequest<PurchaseOrder>(
    "/purchase-orders",
    formData
  )
  return response.data as PurchaseOrder
}

export async function updatePurchaseOrder(
  id: number,
  payload: UpdatePurchaseOrderPayload,
  attachment?: File | null
) {
  const formData = new FormData()
  appendPurchaseOrderToFormData(formData, payload)

  if (attachment) {
    formData.append("attachment", attachment)
  }

  const response = await apiFormRequest<PurchaseOrder>(
    `/purchase-orders/${id}`,
    formData,
    "PATCH"
  )

  return response.data as PurchaseOrder
}

export async function deletePurchaseOrder(id: number) {
  await apiRequest(`/purchase-orders/${id}`, { method: "DELETE" })
}

export async function approvePurchaseOrder(id: number, approvedBy: number) {
  const response = await apiRequest<PurchaseOrder>(
    `/purchase-orders/${id}/approve`,
    {
      method: "PATCH",
      body: JSON.stringify({ approved_by: approvedBy }),
    }
  )
  return response.data as PurchaseOrder
}

export async function cancelPurchaseOrder(id: number) {
  const response = await apiRequest<PurchaseOrder>(
    `/purchase-orders/${id}/cancel`,
    { method: "PATCH" }
  )
  return response.data as PurchaseOrder
}

function buildStagingQuery(params: StagingPurchaseOrdersListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.status) search.set("status", params.status)

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getStagingPurchaseOrders(
  params: StagingPurchaseOrdersListParams = {}
) {
  const response = await apiRequest<StagingPurchaseOrder[]>(
    `/purchase-orders/staging${buildStagingQuery(params)}`
  )

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getStagingDetail(id: number) {
  const response = await apiRequest<StagingPurchaseOrder>(
    `/purchase-orders/${id}/staging`
  )
  return response.data as StagingPurchaseOrder
}

export async function recordStagingReceipt(
  id: number,
  items: StagingReceiptItemPayload[]
) {
  const response = await apiRequest<StagingPurchaseOrder>(
    `/purchase-orders/${id}/staging/receive`,
    {
      method: "POST",
      body: JSON.stringify({ items }),
    }
  )
  return response.data as StagingPurchaseOrder
}

export async function returnToVendor(
  id: number,
  items: VendorReturnItemPayload[]
) {
  const response = await apiRequest<StagingPurchaseOrder>(
    `/purchase-orders/${id}/staging/returns`,
    {
      method: "POST",
      body: JSON.stringify({ items }),
    }
  )
  return response.data as StagingPurchaseOrder
}

export async function acceptStagingToStock(
  id: number,
  payload: { items: StagingAcceptItemPayload[] }
) {
  const response = await apiRequest<StagingPurchaseOrder>(
    `/purchase-orders/${id}/staging/accept`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
  return response.data as StagingPurchaseOrder
}
