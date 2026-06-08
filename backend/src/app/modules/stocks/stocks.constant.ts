export const STOCKS_FILTERABLE_FIELDS = ['searchTerm', 'itemId'];

export const STOCKS_SORTABLE_FIELDS = [
  'id',
  'item_id',
  'quantity',
  'created_at',
  'updated_at',
] as const;

export const STOCKS_SORT_COLUMN_MAP = {
  id: 's.id',
  item_id: 's.item_id',
  quantity: 's.quantity',
  created_at: 's.created_at',
  updated_at: 's.updated_at',
} as const;

export const BULK_STOCK_TEMPLATE_HEADERS = [
  'item_id',
  'quantity',
  'unit_id',
] as const;
