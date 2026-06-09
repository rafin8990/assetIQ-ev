import { apiRequest } from "@/lib/api/client"
import type { DateRangeReturnReport } from "@/types/return-reports"

export async function getDateRangeReturnReport(fromDate: string, toDate: string) {
  const response = await apiRequest<DateRangeReturnReport>(
    `/return-requests/reports/date-range?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`
  )
  return response.data as DateRangeReturnReport
}
