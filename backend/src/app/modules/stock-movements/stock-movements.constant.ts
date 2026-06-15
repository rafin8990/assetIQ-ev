export const STOCK_MOVEMENT_STATUSES = [
  'pending',
  'approved',
  'ready',
  'in_transit',
  'completed',
  'cancelled',
] as const;

export const STOCK_MOVEMENT_ITEM_STATUSES = [
  'pending',
  'partial_ready',
  'ready',
  'partial_transit',
  'in_transit',
  'partial_confirmed',
  'completed',
] as const;

export const STOCK_MOVEMENTS_FILTERABLE_FIELDS = [
  'searchTerm',
  'status',
  'sourceLocationId',
  'destinationLocationId',
];

export const STOCK_MOVEMENTS_SORTABLE_FIELDS = [
  'movement_number',
  'status',
  'created_at',
  'updated_at',
] as const;

export const STOCK_MOVEMENTS_SORT_COLUMN_MAP = {
  movement_number: 'sm.movement_number',
  status: 'sm.status',
  created_at: 'sm.created_at',
  updated_at: 'sm.updated_at',
} as const;
