export type PurchaseOrderReportSummary = {
  order_count: number
  item_count?: number
  total_amount: number
  total_paid: number
  total_due: number
}

export type DailyReportItem = {
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

export type DailyReport = {
  date: string
  items: DailyReportItem[]
  summary: PurchaseOrderReportSummary
}

export type DateRangeReportOrder = {
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

export type DateRangeReport = {
  from_date: string
  to_date: string
  orders: DateRangeReportOrder[]
  summary: PurchaseOrderReportSummary
}

export type DuePaidReport = {
  from_date: string
  to_date: string
  payment_type: "due" | "paid"
  orders: DateRangeReportOrder[]
  summary: PurchaseOrderReportSummary
}

export type MonthwiseReportRow = {
  month: number
  month_label: string
  order_count: number
  total_amount: number
  total_paid: number
  total_due: number
}

export type MonthwiseReport = {
  year: number
  months: MonthwiseReportRow[]
  summary: PurchaseOrderReportSummary
}
