export type Brand = {
  id: number
  name: string
  slug: string | null
  image: string | null
  created_at: string
  updated_at: string
}

export type CreateBrandPayload = {
  name: string
  slug?: string | null
  image?: string | null
}

export type UpdateBrandPayload = {
  name?: string
  slug?: string | null
  image?: string | null
}

export type BrandsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
}
