import type { PurchaseOrderStatus } from "@/types/purchase-orders"

export type StagingPoItem = {
  id: number
  po_id: number
  item_id: number
  quantity: number
  received_quantity: number
  returned_quantity: number
  accepted_quantity: number
  ordered_quantity: number
  in_staging_quantity: number
  is_line_fully_received: boolean
  unit_id: number | null
  per_unit_amount: number | null
  total_amount: number | null
  discount_amount: number | null
  created_at: string
  updated_at: string
  item_name?: string | null
  unit_name?: string | null
}

export type PoVendorReturn = {
  id: number
  po_id: number
  po_item_id: number
  quantity: number
  reason: string
  returned_by: number
  created_at: string
  item_name?: string | null
  returned_by_name?: string | null
}

export type StagingPurchaseOrder = {
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
  staged_by: number | null
  staged_at: string | null
  order_type: string
  created_at: string
  updated_at: string
  created_by_name?: string | null
  vendor_name?: string | null
  vendor_company_name?: string | null
  approved_by_name?: string | null
  received_by_name?: string | null
  staged_by_name?: string | null
  fully_received_lines: number
  total_lines: number
  items: StagingPoItem[]
  returns?: PoVendorReturn[]
}

export type StagingReceiptItemPayload = {
  po_item_id: number
  quantity: number
}

export type VendorReturnItemPayload = {
  po_item_id: number
  quantity: number
  reason: string
}

export type StagingAcceptItemPayload = {
  po_item_id: number
  quantity: number
  location_id: number
}

export type StagingAcceptPayload = {
  items: StagingAcceptItemPayload[]
}

export type StagingPurchaseOrdersListParams = {
  page?: number
  limit?: number
  searchTerm?: string
  status?: "approved" | "in_staging" | "partially_received" | "fully_received"
}
