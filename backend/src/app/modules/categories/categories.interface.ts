export type ICategory = {
  id: number;
  name: string;
  slug: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ICategoryFilters = {
  searchTerm?: string;
};

export type ICreateCategoryPayload = {
  name: string;
  slug?: string | null;
};

export type IUpdateCategoryPayload = {
  name?: string;
  slug?: string | null;
};
