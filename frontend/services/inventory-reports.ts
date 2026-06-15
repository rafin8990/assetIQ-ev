import { apiRequest } from "@/lib/api/client"
import type {
  DailyMovementReport,
  DateRangeMovementReport,
  MainStockUpdateReport,
  MonthwiseMovementReport,
  UserWiseMovementReport,
} from "@/types/inventory-reports"

export async function getDailyMovementReport(date: string) {
  const response = await apiRequest<DailyMovementReport>(
    `/inventory/reports/daily-movement?date=${encodeURIComponent(date)}`
  )
  return response.data as DailyMovementReport
}

export async function getDateRangeMovementReport(
  fromDate: string,
  toDate: string
) {
  const params = new URLSearchParams({
    fromDate,
    toDate,
  })
  const response = await apiRequest<DateRangeMovementReport>(
    `/inventory/reports/date-range-movement?${params.toString()}`
  )
  return response.data as DateRangeMovementReport
}

export async function getMonthwiseMovementReport(year: number) {
  const response = await apiRequest<MonthwiseMovementReport>(
    `/inventory/reports/monthwise-movement?year=${year}`
  )
  return response.data as MonthwiseMovementReport
}

export async function getUserWiseMovementReport(
  fromDate: string,
  toDate: string,
  userId?: number
) {
  const params = new URLSearchParams({
    fromDate,
    toDate,
  })
  if (userId !== undefined) {
    params.set("userId", String(userId))
  }
  const response = await apiRequest<UserWiseMovementReport>(
    `/inventory/reports/user-wise-movement?${params.toString()}`
  )
  return response.data as UserWiseMovementReport
}

export async function getMainStockUpdateReport(
  fromDate: string,
  toDate: string,
  itemId?: number,
  vendorId?: number
) {
  const params = new URLSearchParams({
    fromDate,
    toDate,
  })
  if (itemId !== undefined) {
    params.set("itemId", String(itemId))
  }
  if (vendorId !== undefined) {
    params.set("vendorId", String(vendorId))
  }
  const response = await apiRequest<MainStockUpdateReport>(
    `/inventory/reports/main-stock-update?${params.toString()}`
  )
  return response.data as MainStockUpdateReport
}
