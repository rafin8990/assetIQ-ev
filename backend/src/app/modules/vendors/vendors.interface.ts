export type IVendor = {
  id: number;
  vendor_name: string;
  company_name: string | null;
  mobile_number: string | null;
  email: string | null;
  image: string | null;
  created_at: Date;
  updated_at: Date;
};

export type IVendorFilters = {
  searchTerm?: string;
};

export type ICreateVendorPayload = {
  vendor_name: string;
  company_name?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  image?: string | null;
};

export type IUpdateVendorPayload = {
  vendor_name?: string;
  company_name?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  image?: string | null;
};
