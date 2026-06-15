export type InventoryMovementReportSummary = {
  movement_count: number
  item_count?: number
  total_requested_quantity: number
  total_confirmed_quantity: number
}

export type MainStockUpdateReportSummary = {
  entry_count: number
  item_count?: number
  total_quantity: number
}

export type DailyMovementReportItem = {
  movement_number: string
  movement_date: string
  movement_status: string
  source_location_name: string | null
  destination_location_name: string | null
  item_name: string | null
  requested_quantity: number
  confirmed_quantity: number | null
  unit_name: string | null
  requested_by_name: string | null
}

export type DailyMovementReport = {
  date: string
  items: DailyMovementReportItem[]
  summary: InventoryMovementReportSummary
}

export type DateRangeMovementReportRow = {
  id: number
  movement_number: string
  created_at: string
  status: string
  source_location_name: string | null
  destination_location_name: string | null
  item_count: number
  total_requested_quantity: number
  total_confirmed_quantity: number
  requested_by_name: string | null
}

export type DateRangeMovementReport = {
  from_date: string
  to_date: string
  movements: DateRangeMovementReportRow[]
  summary: InventoryMovementReportSummary
}

export type MonthwiseMovementReportRow = {
  month: number
  month_label: string
  movement_count: number
  item_count: number
  total_requested_quantity: number
  total_confirmed_quantity: number
}

export type MonthwiseMovementReport = {
  year: number
  months: MonthwiseMovementReportRow[]
  summary: InventoryMovementReportSummary
}

export type UserWiseMovementReportRow = {
  user_id: number
  user_name: string | null
  movement_count: number
  item_count: number
  total_requested_quantity: number
  total_confirmed_quantity: number
}

export type UserWiseMovementReport = {
  from_date: string
  to_date: string
  user_id?: number
  users: UserWiseMovementReportRow[]
  summary: InventoryMovementReportSummary
}

export type MainStockUpdateReportItem = {
  created_at: string
  item_name: string | null
  vendor_name: string | null
  quantity: number
  unit_name: string | null
  source_type: string
  reference: string | null
}

export type MainStockUpdateReport = {
  from_date: string
  to_date: string
  location_name: string
  items: MainStockUpdateReportItem[]
  summary: MainStockUpdateReportSummary
}
