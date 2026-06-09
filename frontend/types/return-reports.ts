export type ReturnReportSummary = {
  return_count: number
  item_count: number
  total_return_quantity: number
}

export type ReturnReportRow = {
  return_id: string
  out_request_id: string
  return_date: string
  status: string
  item_name: string | null
  return_quantity: number
  unit_name: string | null
  requested_by_name: string | null
  approved_by_name: string | null
}

export type DateRangeReturnReport = {
  from_date: string
  to_date: string
  items: ReturnReportRow[]
  summary: ReturnReportSummary
}
