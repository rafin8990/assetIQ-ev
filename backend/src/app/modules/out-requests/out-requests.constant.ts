export const OUT_REQUEST_STATUSES = [
  'pending',
  'approved',
  'cancelled',
  'out',
] as const;

export const OUT_REQUEST_ITEM_STATUSES = ['pending', 'partial', 'out'] as const;

export const OUT_REQUESTS_FILTERABLE_FIELDS = [
  'searchTerm',
  'status',
  'requestedBy',
] as const;

export const OUT_REQUESTS_SORTABLE_FIELDS = [
  'id',
  'request_id',
  'status',
  'created_at',
  'updated_at',
] as const;

export const OUT_REQUESTS_SORT_COLUMN_MAP = {
  id: 'orq.id',
  request_id: 'orq.request_id',
  status: 'orq.status',
  created_at: 'orq.created_at',
  updated_at: 'orq.updated_at',
} as const;
