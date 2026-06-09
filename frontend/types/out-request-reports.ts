export type OutRequestReportSummary = {
  request_count: number
  item_count?: number
  total_requested_quantity: number
  total_out_quantity: number
}

export type DailyOutRequestReportItem = {
  request_id: string
  request_date: string
  request_status: string
  item_name: string | null
  requested_quantity: number
  out_quantity: number | null
  unit_name: string | null
  item_status: string
}

export type DailyOutRequestReport = {
  date: string
  items: DailyOutRequestReportItem[]
  summary: OutRequestReportSummary
}

export type DateRangeOutRequestReportRow = {
  id: number
  request_id: string
  created_at: string
  status: string
  item_count: number
  total_requested_quantity: number
  total_out_quantity: number
  requested_by_name: string | null
}

export type DateRangeOutRequestReport = {
  from_date: string
  to_date: string
  requests: DateRangeOutRequestReportRow[]
  summary: OutRequestReportSummary
}

export type MonthwiseOutRequestReportRow = {
  month: number
  month_label: string
  request_count: number
  item_count: number
  total_requested_quantity: number
  total_out_quantity: number
}

export type MonthwiseOutRequestReport = {
  year: number
  months: MonthwiseOutRequestReportRow[]
  summary: OutRequestReportSummary
}

export type UserWiseOutRequestReportRow = {
  user_id: number
  user_name: string | null
  request_count: number
  item_count: number
  total_requested_quantity: number
  total_out_quantity: number
}

export type UserWiseOutRequestReport = {
  from_date: string
  to_date: string
  user_id?: number
  users: UserWiseOutRequestReportRow[]
  summary: OutRequestReportSummary
}
