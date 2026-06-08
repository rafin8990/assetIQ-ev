export type PurchaseOrderStatus =
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'received';

export type PurchaseOrderType = 'by_requisition' | 'direct';

export type IPurchaseOrder = {
  id: number;
  po_number: string;
  created_by: number;
  description: string | null;
  status: PurchaseOrderStatus;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  discount_amount: number | null;
  attachment: string | null;
  approved_by: number | null;
  received_by: number | null;
  order_type: PurchaseOrderType;
  created_at: Date;
  updated_at: Date;
};

export type IPoItem = {
  id: number;
  po_id: number;
  item_id: number;
  quantity: number;
  unit_id: number | null;
  per_unit_amount: number | null;
  total_amount: number | null;
  discount_amount: number | null;
  created_at: Date;
  updated_at: Date;
};

export type IPoItemWithRelations = IPoItem & {
  item_name?: string | null;
  unit_name?: string | null;
};

export type IPurchaseOrderRequisitionLink = {
  id: number;
  req_id: string;
  description: string | null;
  status: string;
};

export type IPurchaseOrderWithRelations = IPurchaseOrder & {
  created_by_name?: string | null;
  approved_by_name?: string | null;
  received_by_name?: string | null;
  items: IPoItemWithRelations[];
  requisitions?: IPurchaseOrderRequisitionLink[];
};

export type IPoItemPayload = {
  item_id: number;
  quantity: number;
  unit_id?: number | null;
  per_unit_amount?: number | null;
  discount_amount?: number | null;
};

export type ICreatePurchaseOrderPayload = {
  created_by: number;
  description?: string | null;
  status?: PurchaseOrderStatus;
  paid_amount?: number | null;
  discount_amount?: number | null;
  approved_by?: number | null;
  received_by?: number | null;
  order_type?: PurchaseOrderType;
  requisition_ids?: number[];
  items: IPoItemPayload[];
};

export type IUpdatePurchaseOrderPayload = {
  created_by?: number;
  description?: string | null;
  status?: PurchaseOrderStatus;
  paid_amount?: number | null;
  discount_amount?: number | null;
  approved_by?: number | null;
  received_by?: number | null;
  order_type?: PurchaseOrderType;
  attachment?: string | null;
  items?: IPoItemPayload[];
};

export type IPurchaseOrderFilters = {
  searchTerm?: string;
  status?: PurchaseOrderStatus;
  orderType?: PurchaseOrderType;
  createdBy?: number;
};
