export type Category = {
  id: number
  name: string
  slug: string | null
  created_at: string
  updated_at: string
}

export type CreateCategoryPayload = {
  name: string
  slug?: string | null
}

export type UpdateCategoryPayload = {
  name?: string
  slug?: string | null
}

export type CategoriesListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
}
