export type IBrand = {
  id: number;
  name: string;
  slug: string | null;
  image: string | null;
  created_at: Date;
  updated_at: Date;
};

export type IBrandFilters = {
  searchTerm?: string;
};

export type ICreateBrandPayload = {
  name: string;
  slug?: string | null;
  image?: string | null;
};

export type IUpdateBrandPayload = {
  name?: string;
  slug?: string | null;
  image?: string | null;
};
