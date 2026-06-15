import {
  getAccessToken,
  handleSessionExpired,
  isAccessTokenExpired,
} from "@/lib/auth/token"
import type { ApiErrorBody, ApiResponse } from "@/lib/api/types"

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api/v1"

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "")

export class ApiError extends Error {
  statusCode: number
  errorMessages?: ApiErrorBody["errorMessages"]

  constructor(
    statusCode: number,
    message: string,
    errorMessages?: ApiErrorBody["errorMessages"]
  ) {
    super(message)
    this.statusCode = statusCode
    this.errorMessages = errorMessages
  }
}

function shouldRedirectOnUnauthorized(endpoint: string) {
  return endpoint !== "/auth/login"
}

function redirectIfSessionExpired(endpoint: string) {
  if (!shouldRedirectOnUnauthorized(endpoint)) return

  handleSessionExpired(window.location.pathname)
}

function ensureAccessTokenValid(endpoint: string) {
  const token = getAccessToken()
  if (!token || !isAccessTokenExpired(token)) return

  redirectIfSessionExpired(endpoint)
  throw new ApiError(401, "Session expired")
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  ensureAccessTokenValid(endpoint)

  const token = getAccessToken()

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = (await response.json()) as ApiResponse<T> | ApiErrorBody

  if (!response.ok || !body.success) {
    if (response.status === 401) {
      redirectIfSessionExpired(endpoint)
    }

    const errorBody = body as ApiErrorBody
    throw new ApiError(
      response.status,
      errorBody.message || "Something went wrong",
      errorBody.errorMessages
    )
  }

  return body as ApiResponse<T>
}

export function getAssetUrl(path: string | null | undefined) {
  if (!path) return null
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`
}

export async function apiFormRequest<T>(
  endpoint: string,
  formData: FormData,
  method: "POST" | "PATCH" = "POST"
): Promise<ApiResponse<T>> {
  ensureAccessTokenValid(endpoint)

  const token = getAccessToken()

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const body = (await response.json()) as ApiResponse<T> | ApiErrorBody

  if (!response.ok || !body.success) {
    if (response.status === 401) {
      redirectIfSessionExpired(endpoint)
    }

    const errorBody = body as ApiErrorBody
    throw new ApiError(
      response.status,
      errorBody.message || "Something went wrong",
      errorBody.errorMessages
    )
  }

  return body as ApiResponse<T>
}

export async function downloadFile(
  endpoint: string,
  filename: string
): Promise<void> {
  ensureAccessTokenValid(endpoint)

  const token = getAccessToken()

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      redirectIfSessionExpired(endpoint)
    }

    throw new ApiError(response.status, "Failed to download file")
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
