export type Location = {
  id: number
  name: string
  location_code: string | null
  created_at: string
  updated_at: string
}

export type CreateLocationPayload = {
  name: string
}

export type UpdateLocationPayload = {
  name: string
}

export type LocationsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
}
