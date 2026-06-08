export type IPurchaseOrderReportSummary = {
  order_count: number
  item_count?: number
  total_amount: number
  total_paid: number
  total_due: number
}

export type IDailyReportItem = {
  po_number: string
  po_date: string
  status: string
  item_name: string | null
  quantity: number
  unit_name: string | null
  per_unit_amount: number | null
  line_total: number | null
  po_total_amount: number | null
  po_paid_amount: number | null
  po_due_amount: number | null
}

export type IDailyReport = {
  date: string
  items: IDailyReportItem[]
  summary: IPurchaseOrderReportSummary
}

export type IDateRangeReportOrder = {
  id: number
  po_number: string
  created_at: string
  status: string
  order_type: string
  total_amount: number | null
  paid_amount: number | null
  due_amount: number | null
  created_by_name: string | null
}

export type IDateRangeReport = {
  from_date: string
  to_date: string
  orders: IDateRangeReportOrder[]
  summary: IPurchaseOrderReportSummary
}

export type IDuePaidReport = {
  from_date: string
  to_date: string
  payment_type: 'due' | 'paid'
  orders: IDateRangeReportOrder[]
  summary: IPurchaseOrderReportSummary
}

export type IMonthwiseReportRow = {
  month: number
  month_label: string
  order_count: number
  total_amount: number
  total_paid: number
  total_due: number
}

export type IMonthwiseReport = {
  year: number
  months: IMonthwiseReportRow[]
  summary: IPurchaseOrderReportSummary
}
