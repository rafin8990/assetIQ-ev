export type ISubCategory = {
  id: number;
  name: string;
  slug: string | null;
  category_id: number;
  created_at: Date;
  updated_at: Date;
};

export type ISubCategoryWithCategory = ISubCategory & {
  category_name: string;
};

export type ISubCategoryFilters = {
  searchTerm?: string;
  categoryId?: number;
};

export type ICreateSubCategoryPayload = {
  name: string;
  slug?: string | null;
  category_id: number;
};

export type IUpdateSubCategoryPayload = {
  name?: string;
  slug?: string | null;
  category_id?: number;
};
