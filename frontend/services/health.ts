import { apiRequest } from "@/lib/api/client"

export type HealthStatus = {
  success: boolean
  message: string
  timestamp: string
  uptime: number
  environment: string
}

export async function getHealthStatus() {
  const response = await apiRequest<HealthStatus>("/health")
  return response.data as HealthStatus
}
