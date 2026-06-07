export const CATEGORIES_SEARCHABLE_FIELDS = ['name', 'slug'];

export const CATEGORIES_FILTERABLE_FIELDS = ['searchTerm'];

export const CATEGORIES_SORTABLE_FIELDS = [
  'id',
  'name',
  'slug',
  'created_at',
  'updated_at',
] as const;
