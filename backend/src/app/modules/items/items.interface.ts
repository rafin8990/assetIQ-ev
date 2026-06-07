export type IItemImage = {
  id: number;
  item_id: number;
  image: string | null;
};

export type IItem = {
  id: number;
  name: string;
  category_id: number | null;
  sub_category_id: number | null;
  description: string | null;
  brand_id: number | null;
  model: string | null;
  type: string | null;
  material: string | null;
  unit_id: number | null;
  low_stock_amount: string | null;
  created_at: Date;
  updated_at: Date;
};

export type IItemWithRelations = IItem & {
  category_name: string | null;
  sub_category_name: string | null;
  brand_name: string | null;
  unit_name: string | null;
  images?: IItemImage[];
};

export type IItemFilters = {
  searchTerm?: string;
  categoryId?: number;
  subCategoryId?: number;
  brandId?: number;
};

export type ICreateItemPayload = {
  name: string;
  category_id?: number | null;
  sub_category_id?: number | null;
  description?: string | null;
  brand_id?: number | null;
  model?: string | null;
  type?: string | null;
  material?: string | null;
  unit_id?: number | null;
  low_stock_amount?: number | null;
};

export type IUpdateItemPayload = {
  name?: string;
  category_id?: number | null;
  sub_category_id?: number | null;
  description?: string | null;
  brand_id?: number | null;
  model?: string | null;
  type?: string | null;
  material?: string | null;
  unit_id?: number | null;
  low_stock_amount?: number | null;
};

export type IBulkImportRow = {
  name: string;
  category_id?: number | null;
  sub_category_id?: number | null;
  description?: string | null;
  brand_id?: number | null;
  model?: string | null;
  type?: string | null;
  material?: string | null;
  unit_id?: number | null;
  low_stock_amount?: number | null;
};

export type IBulkImportResult = {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
};
