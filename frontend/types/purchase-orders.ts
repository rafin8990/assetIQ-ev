export type PurchaseOrderStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "received"
  | "in_staging"
  | "partially_received"
  | "fully_received"

export type PurchaseOrderType = "by_requisition" | "direct"

export type PoItem = {
  id: number
  po_id: number
  item_id: number
  quantity: number
  received_quantity?: number
  returned_quantity?: number
  unit_id: number | null
  per_unit_amount: number | null
  total_amount: number | null
  discount_amount: number | null
  created_at: string
  updated_at: string
  item_name?: string | null
  unit_name?: string | null
}

export type PurchaseOrderRequisition = {
  id: number
  req_id: string
  description: string | null
  status: string
}

export type PurchaseOrder = {
  id: number
  po_number: string
  created_by: number
  vendor_id: number | null
  description: string | null
  status: PurchaseOrderStatus
  total_amount: number | null
  paid_amount: number | null
  due_amount: number | null
  discount_amount: number | null
  attachment: string | null
  approved_by: number | null
  received_by: number | null
  staged_by?: number | null
  staged_at?: string | null
  order_type: PurchaseOrderType
  created_at: string
  updated_at: string
  created_by_name?: string | null
  vendor_name?: string | null
  vendor_company_name?: string | null
  approved_by_name?: string | null
  received_by_name?: string | null
  staged_by_name?: string | null
  items: PoItem[]
  requisitions?: PurchaseOrderRequisition[]
}

export type PoItemPayload = {
  item_id: number
  quantity: number
  unit_id?: number | null
  per_unit_amount?: number | null
  discount_amount?: number | null
}

export type CreatePurchaseOrderPayload = {
  created_by: number
  vendor_id?: number | null
  description?: string | null
  status?: PurchaseOrderStatus
  paid_amount?: number | null
  discount_amount?: number | null
  order_type?: PurchaseOrderType
  requisition_ids?: number[]
  items: PoItemPayload[]
}

export type UpdatePurchaseOrderPayload = {
  created_by?: number
  vendor_id?: number | null
  description?: string | null
  status?: PurchaseOrderStatus
  paid_amount?: number | null
  discount_amount?: number | null
  order_type?: PurchaseOrderType
  items?: PoItemPayload[]
}

export type PurchaseOrdersListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  status?: PurchaseOrderStatus
  orderType?: PurchaseOrderType
  createdBy?: number
  vendorId?: number
}
