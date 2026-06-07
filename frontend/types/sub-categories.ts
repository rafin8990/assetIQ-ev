export type SubCategory = {
  id: number
  name: string
  slug: string | null
  category_id: number
  category_name?: string
  created_at: string
  updated_at: string
}

export type CreateSubCategoryPayload = {
  name: string
  slug?: string | null
  category_id: number
}

export type UpdateSubCategoryPayload = {
  name?: string
  slug?: string | null
  category_id?: number
}

export type SubCategoriesListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  categoryId?: number
}
