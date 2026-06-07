export const ITEMS_SEARCHABLE_FIELDS = ['name', 'model', 'type', 'material'];

export const ITEMS_FILTERABLE_FIELDS = [
  'searchTerm',
  'categoryId',
  'subCategoryId',
  'brandId',
];

export const ITEMS_SORTABLE_FIELDS = [
  'id',
  'name',
  'model',
  'type',
  'material',
  'low_stock_amount',
  'created_at',
  'updated_at',
] as const;

export const ITEMS_SORT_COLUMN_MAP = {
  id: 'i.id',
  name: 'i.name',
  model: 'i.model',
  type: 'i.type',
  material: 'i.material',
  low_stock_amount: 'i.low_stock_amount',
  created_at: 'i.created_at',
  updated_at: 'i.updated_at',
} as const;

export const BULK_IMPORT_TEMPLATE_HEADERS = [
  'name',
  'category_id',
  'sub_category_id',
  'description',
  'brand_id',
  'model',
  'type',
  'material',
  'unit_id',
  'low_stock_amount',
] as const;
