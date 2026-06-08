export const PURCHASE_ORDERS_FILTERABLE_FIELDS = [
  'searchTerm',
  'status',
  'orderType',
  'createdBy',
];

export const PURCHASE_ORDER_STATUSES = [
  'pending',
  'approved',
  'cancelled',
  'received',
] as const;

export const PURCHASE_ORDER_TYPES = ['by_requisition', 'direct'] as const;

export const PURCHASE_ORDERS_SORTABLE_FIELDS = [
  'id',
  'po_number',
  'status',
  'order_type',
  'total_amount',
  'created_at',
  'updated_at',
] as const;

export const PURCHASE_ORDERS_SORT_COLUMN_MAP = {
  id: 'po.id',
  po_number: 'po.po_number',
  status: 'po.status',
  order_type: 'po.order_type',
  total_amount: 'po.total_amount',
  created_at: 'po.created_at',
  updated_at: 'po.updated_at',
} as const;
