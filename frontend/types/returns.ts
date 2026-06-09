export type ReturnRequestStatus = "pending" | "approved" | "cancelled"

export type ReturnRequestItem = {
  id: number
  return_request_id: number
  out_request_item_id: number
  item_id: number
  return_quantity: number
  unit_id: number | null
  created_at: string
  updated_at: string
  item_name?: string | null
  unit_name?: string | null
  out_quantity?: number | null
  already_returned_quantity?: number | null
  returnable_quantity?: number | null
}

export type ReturnRequest = {
  id: number
  return_id: string
  out_request_id: number
  description: string | null
  status: ReturnRequestStatus
  requested_by: number
  approved_by: number | null
  created_at: string
  updated_at: string
  out_request_request_id?: string | null
  requested_by_name?: string | null
  approved_by_name?: string | null
  items: ReturnRequestItem[]
}

export type ReturnRequestItemPayload = {
  out_request_item_id: number
  item_id: number
  return_quantity: number
  unit_id?: number | null
}

export type CreateReturnRequestPayload = {
  out_request_id: number
  description?: string | null
  requested_by: number
  items: ReturnRequestItemPayload[]
}

export type UpdateReturnRequestPayload = {
  description?: string | null
  requested_by?: number
  items?: ReturnRequestItemPayload[]
}

export type ReturnRequestsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  status?: ReturnRequestStatus
  requestedBy?: number
  outRequestId?: number
}
