import { apiRequest } from "@/lib/api/client"
import type {
  DailyOutRequestReport,
  DateRangeOutRequestReport,
  MonthwiseOutRequestReport,
  UserWiseOutRequestReport,
} from "@/types/out-request-reports"

export async function getDailyOutRequestReport(date: string) {
  const response = await apiRequest<DailyOutRequestReport>(
    `/out-requests/reports/daily?date=${encodeURIComponent(date)}`
  )
  return response.data as DailyOutRequestReport
}

export async function getDateRangeOutRequestReport(
  fromDate: string,
  toDate: string
) {
  const params = new URLSearchParams({
    fromDate,
    toDate,
  })
  const response = await apiRequest<DateRangeOutRequestReport>(
    `/out-requests/reports/date-range?${params.toString()}`
  )
  return response.data as DateRangeOutRequestReport
}

export async function getMonthwiseOutRequestReport(year: number) {
  const response = await apiRequest<MonthwiseOutRequestReport>(
    `/out-requests/reports/monthwise?year=${year}`
  )
  return response.data as MonthwiseOutRequestReport
}

export async function getUserWiseOutRequestReport(
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
  const response = await apiRequest<UserWiseOutRequestReport>(
    `/out-requests/reports/user-wise?${params.toString()}`
  )
  return response.data as UserWiseOutRequestReport
}
