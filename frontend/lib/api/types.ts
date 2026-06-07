export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages?: number
  hasNext?: boolean
  hasPrev?: boolean
}

export type ApiResponse<T> = {
  statusCode: number
  success: boolean
  message?: string | null
  meta?: PaginationMeta | null
  data?: T | null
}

export type ApiErrorBody = {
  success: false
  message: string
  errorMessages?: { path: string | number; message: string }[]
}
