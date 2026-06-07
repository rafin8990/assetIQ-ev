export const SUB_CATEGORIES_SEARCHABLE_FIELDS = ['name', 'slug', 'category_name'];

export const SUB_CATEGORIES_FILTERABLE_FIELDS = ['searchTerm', 'categoryId'];

export const SUB_CATEGORIES_SORTABLE_FIELDS = [
  'id',
  'name',
  'slug',
  'category_id',
  'created_at',
  'updated_at',
] as const;

export const SUB_CATEGORIES_SORT_COLUMN_MAP = {
  id: 'sc.id',
  name: 'sc.name',
  slug: 'sc.slug',
  category_id: 'sc.category_id',
  created_at: 'sc.created_at',
  updated_at: 'sc.updated_at',
} as const;
