export type RequisitionStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "ordered"

export type RequisitionItem = {
  id: number
  requisition_id: number
  item_id: number
  quantity: number
  unit_id: number
  created_at: string
  updated_at: string
  item_name?: string | null
  unit_name?: string | null
}

export type Requisition = {
  id: number
  req_id: string
  description: string | null
  created_by: number
  approved_by: number | null
  status: RequisitionStatus
  attachment: string | null
  created_at: string
  updated_at: string
  created_by_name?: string | null
  approved_by_name?: string | null
  items: RequisitionItem[]
}

export type RequisitionItemPayload = {
  item_id: number
  quantity: number
  unit_id: number
}

export type CreateRequisitionPayload = {
  description?: string | null
  created_by: number
  approved_by?: number | null
  status?: RequisitionStatus
  items: RequisitionItemPayload[]
}

export type UpdateRequisitionPayload = {
  description?: string | null
  created_by?: number
  approved_by?: number | null
  status?: RequisitionStatus
  items?: RequisitionItemPayload[]
}

export type RequisitionsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  status?: RequisitionStatus
  createdBy?: number
}
