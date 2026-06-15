export type LocationStockRow = {
  location_id: number
  location_name: string | null
  location_code: string | null
  item_id: number
  item_name: string | null
  vendor_id: number | null
  vendor_name: string | null
  vendor_company_name: string | null
  quantity: number
  unit_id: number | null
  unit_name: string | null
}

export type TotalStockRow = {
  item_id: number
  item_name: string | null
  vendor_id: number | null
  vendor_name: string | null
  vendor_company_name: string | null
  quantity: number
  unit_id: number | null
  unit_name: string | null
}

export type TotalStockLocationBreakdown = {
  location_id: number
  location_name: string | null
  quantity: number
}

export type StockLot = {
  id: number
  item_id: number
  location_id: number
  vendor_id: number | null
  po_id: number | null
  po_item_id: number | null
  quantity: number
  quantity_remaining: number
  unit_id: number | null
  source_type: string
  source_id: number | null
  received_at: string
  created_at: string
  updated_at: string
  item_name?: string | null
  unit_name?: string | null
  vendor_name?: string | null
  vendor_company_name?: string | null
  location_name?: string | null
  location_code?: string | null
  po_number?: string | null
}

export type InventoryListParams = {
  page?: number
  limit?: number
  searchTerm?: string
  locationId?: number
  itemId?: number
  vendorId?: number
}

export type CreateManualLotPayload = {
  item_id: number
  location_id: number
  vendor_id?: number | null
  quantity: number
  unit_id?: number | null
}
