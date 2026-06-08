export type Vendor = {
  id: number
  vendor_name: string
  company_name: string | null
  mobile_number: string | null
  email: string | null
  image: string | null
  created_at: string
  updated_at: string
}

export type CreateVendorPayload = {
  vendor_name: string
  company_name?: string | null
  mobile_number?: string | null
  email?: string | null
}

export type UpdateVendorPayload = {
  vendor_name?: string
  company_name?: string | null
  mobile_number?: string | null
  email?: string | null
}

export type VendorsListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
}
