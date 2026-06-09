export type IOutRequestReportSummary = {
  request_count: number
  item_count?: number
  total_requested_quantity: number
  total_out_quantity: number
}

export type IDailyOutRequestReportItem = {
  request_id: string
  request_date: string
  request_status: string
  item_name: string | null
  requested_quantity: number
  out_quantity: number | null
  unit_name: string | null
  item_status: string
}

export type IDailyOutRequestReport = {
  date: string
  items: IDailyOutRequestReportItem[]
  summary: IOutRequestReportSummary
}

export type IDateRangeOutRequestReportRow = {
  id: number
  request_id: string
  created_at: string
  status: string
  item_count: number
  total_requested_quantity: number
  total_out_quantity: number
  requested_by_name: string | null
}

export type IDateRangeOutRequestReport = {
  from_date: string
  to_date: string
  requests: IDateRangeOutRequestReportRow[]
  summary: IOutRequestReportSummary
}

export type IMonthwiseOutRequestReportRow = {
  month: number
  month_label: string
  request_count: number
  item_count: number
  total_requested_quantity: number
  total_out_quantity: number
}

export type IMonthwiseOutRequestReport = {
  year: number
  months: IMonthwiseOutRequestReportRow[]
  summary: IOutRequestReportSummary
}

export type IUserWiseOutRequestReportRow = {
  user_id: number
  user_name: string | null
  request_count: number
  item_count: number
  total_requested_quantity: number
  total_out_quantity: number
}

export type IUserWiseOutRequestReport = {
  from_date: string
  to_date: string
  user_id?: number
  users: IUserWiseOutRequestReportRow[]
  summary: IOutRequestReportSummary
}
