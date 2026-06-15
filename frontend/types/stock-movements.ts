export type StockMovementStatus =
  | "pending"
  | "approved"
  | "ready"
  | "in_transit"
  | "completed"
  | "cancelled"

export type StockMovementItemStatus =
  | "pending"
  | "partial_ready"
  | "ready"
  | "partial_transit"
  | "in_transit"
  | "partial_confirmed"
  | "completed"

export type StockMovementItem = {
  id: number
  movement_id: number
  item_id: number
  requested_quantity: number
  ready_quantity: number
  transferred_quantity: number
  confirmed_quantity: number
  unit_id: number | null
  status: StockMovementItemStatus
  created_at: string
  updated_at: string
  item_name?: string | null
  unit_name?: string | null
  available_quantity?: number | null
}

export type StockMovement = {
  id: number
  movement_number: string
  status: StockMovementStatus
  source_location_id: number
  destination_location_id: number
  notes: string | null
  requested_by: number
  approved_by: number | null
  ready_by: number | null
  transferred_by: number | null
  confirmed_by: number | null
  created_at: string
  updated_at: string
  source_location_name?: string | null
  destination_location_name?: string | null
  requested_by_name?: string | null
  approved_by_name?: string | null
  ready_by_name?: string | null
  transferred_by_name?: string | null
  confirmed_by_name?: string | null
  items: StockMovementItem[]
}

export type StockMovementItemPayload = {
  item_id: number
  requested_quantity: number
  unit_id?: number | null
}

export type CreateStockMovementPayload = {
  source_location_id: number
  destination_location_id: number
  notes?: string | null
  requested_by: number
  items: StockMovementItemPayload[]
}

export type StockMovementLineActionPayload = {
  item_id: number
  quantity?: number | null
}

export type StockMovementActionPayload = {
  items?: StockMovementLineActionPayload[]
}

export type StockMovementsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  status?: StockMovementStatus
  sourceLocationId?: number
  destinationLocationId?: number
}
