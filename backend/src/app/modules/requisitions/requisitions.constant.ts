export const REQUISITIONS_FILTERABLE_FIELDS = [
  'searchTerm',
  'status',
  'createdBy',
];

export const REQUISITIONS_SORTABLE_FIELDS = [
  'id',
  'req_id',
  'status',
  'created_at',
  'updated_at',
] as const;

export const REQUISITIONS_SORT_COLUMN_MAP = {
  id: 'r.id',
  req_id: 'r.req_id',
  status: 'r.status',
  created_at: 'r.created_at',
  updated_at: 'r.updated_at',
} as const;

export const REQUISITION_STATUSES = [
  'pending',
  'approved',
  'cancelled',
  'ordered',
] as const;
