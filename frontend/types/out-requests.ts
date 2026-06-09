export type OutRequestStatus = "pending" | "approved" | "cancelled" | "out"

export type OutRequestItemStatus = "pending" | "partial" | "out"

export type OutRequestItem = {
  id: number
  out_request_id: number
  item_id: number
  requested_quantity: number
  out_quantity: number | null
  unit_id: number | null
  status: OutRequestItemStatus
  out_by: number | null
  created_at: string
  updated_at: string
  item_name?: string | null
  unit_name?: string | null
  available_quantity?: number | null
}

export type OutRequest = {
  id: number
  request_id: string
  description: string | null
  status: OutRequestStatus
  requested_by: number
  approved_by: number | null
  out_by: number | null
  created_at: string
  updated_at: string
  requested_by_name?: string | null
  approved_by_name?: string | null
  out_by_name?: string | null
  items: OutRequestItem[]
}

export type OutRequestItemPayload = {
  item_id: number
  requested_quantity: number
  unit_id?: number | null
}

export type CreateOutRequestPayload = {
  description?: string | null
  requested_by: number
  items: OutRequestItemPayload[]
}

export type UpdateOutRequestPayload = {
  description?: string | null
  requested_by?: number
  items?: OutRequestItemPayload[]
}

export type ProcessOutRequestItemPayload = {
  item_id: number
  out_quantity?: number | null
}

export type ProcessOutRequestPayload = {
  out_by: number
  items?: ProcessOutRequestItemPayload[]
}

export type OutRequestsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  status?: OutRequestStatus
  requestedBy?: number
}
