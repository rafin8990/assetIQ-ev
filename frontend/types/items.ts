export type ItemImage = {
  id: number
  item_id: number
  image: string | null
}

export type Item = {
  id: number
  name: string
  category_id: number | null
  sub_category_id: number | null
  description: string | null
  brand_id: number | null
  model: string | null
  type: string | null
  material: string | null
  unit_id: number | null
  low_stock_amount: string | null
  created_at: string
  updated_at: string
  category_name?: string | null
  sub_category_name?: string | null
  brand_name?: string | null
  unit_name?: string | null
  images?: ItemImage[]
}

export type CreateItemPayload = {
  name: string
  category_id?: number | null
  sub_category_id?: number | null
  description?: string | null
  brand_id?: number | null
  model?: string | null
  type?: string | null
  material?: string | null
  unit_id?: number | null
  low_stock_amount?: number | null
}

export type UpdateItemPayload = Partial<CreateItemPayload>

export type ItemsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  categoryId?: number
  subCategoryId?: number
  brandId?: number
}

export type BulkImportResult = {
  created: number
  failed: number
  errors: { row: number; message: string }[]
}
