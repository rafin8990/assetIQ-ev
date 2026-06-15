export const INVENTORY_FILTERABLE_FIELDS = [
  'searchTerm',
  'locationId',
  'itemId',
  'vendorId',
];

export const LOCATION_STOCK_SORTABLE_FIELDS = [
  'item_name',
  'vendor_name',
  'quantity',
  'updated_at',
] as const;

export const TOTAL_STOCK_SORTABLE_FIELDS = [
  'item_name',
  'vendor_name',
  'quantity',
] as const;
