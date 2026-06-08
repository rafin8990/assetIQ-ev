export type Stock = {
  id: number
  item_id: number
  quantity: number
  unit_id: number | null
  created_at: string
  updated_at: string
  item_name?: string | null
  unit_name?: string | null
}

export type StocksListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  itemId?: number
}

export type CreateManualStockPayload = {
  item_id: number
  quantity: number
  unit_id?: number | null
}

export type UpdateStockPayload = {
  quantity?: number
  unit_id?: number | null
}

export type BulkStockImportError = {
  row: number
  message: string
}

export type BulkStockImportResult = {
  processed: number
  failed: number
  errors: BulkStockImportError[]
}
