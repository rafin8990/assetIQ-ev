import { apiRequest } from "@/lib/api/client"
import type {
  DailyReport,
  DateRangeReport,
  DuePaidReport,
  MonthwiseReport,
} from "@/types/purchase-order-reports"

export async function getDailyPurchaseOrderReport(date: string) {
  const response = await apiRequest<DailyReport>(
    `/purchase-orders/reports/daily?date=${encodeURIComponent(date)}`
  )
  return response.data as DailyReport
}

export async function getDateRangePurchaseOrderReport(
  fromDate: string,
  toDate: string
) {
  const params = new URLSearchParams({
    fromDate,
    toDate,
  })
  const response = await apiRequest<DateRangeReport>(
    `/purchase-orders/reports/date-range?${params.toString()}`
  )
  return response.data as DateRangeReport
}

export async function getDuePaidPurchaseOrderReport(
  fromDate: string,
  toDate: string,
  paymentType: "due" | "paid"
) {
  const params = new URLSearchParams({
    fromDate,
    toDate,
    paymentType,
  })
  const response = await apiRequest<DuePaidReport>(
    `/purchase-orders/reports/due-paid?${params.toString()}`
  )
  return response.data as DuePaidReport
}

export async function getMonthwisePurchaseOrderReport(year: number) {
  const response = await apiRequest<MonthwiseReport>(
    `/purchase-orders/reports/monthwise?year=${year}`
  )
  return response.data as MonthwiseReport
}
