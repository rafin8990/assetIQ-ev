export const RETURN_REQUEST_STATUSES = [
  'pending',
  'approved',
  'cancelled',
] as const;

export const RETURN_REQUESTS_FILTERABLE_FIELDS = [
  'searchTerm',
  'status',
  'requestedBy',
  'outRequestId',
] as const;

export const RETURN_REQUESTS_SORTABLE_FIELDS = [
  'id',
  'return_id',
  'status',
  'created_at',
  'updated_at',
] as const;

export const RETURN_REQUESTS_SORT_COLUMN_MAP = {
  id: 'rr.id',
  return_id: 'rr.return_id',
  status: 'rr.status',
  created_at: 'rr.created_at',
  updated_at: 'rr.updated_at',
} as const;
