export type Unit = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export type CreateUnitPayload = {
  name: string
}

export type UpdateUnitPayload = {
  name: string
}

export type UnitsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
}
