export type PurchaseOrderStatus =
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'received'
  | 'in_staging'
  | 'partially_received'
  | 'fully_received';

export type PurchaseOrderType = 'by_requisition' | 'direct';

export type IPurchaseOrder = {
  id: number;
  po_number: string;
  created_by: number;
  vendor_id: number | null;
  description: string | null;
  status: PurchaseOrderStatus;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  discount_amount: number | null;
  attachment: string | null;
  approved_by: number | null;
  received_by: number | null;
  staged_by: number | null;
  staged_at: Date | null;
  order_type: PurchaseOrderType;
  created_at: Date;
  updated_at: Date;
};

export type IPoItem = {
  id: number;
  po_id: number;
  item_id: number;
  quantity: number;
  received_quantity: number;
  returned_quantity: number;
  accepted_quantity: number;
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
  vendor_name?: string | null;
  vendor_company_name?: string | null;
  approved_by_name?: string | null;
  received_by_name?: string | null;
  staged_by_name?: string | null;
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
  vendor_id?: number | null;
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
  vendor_id?: number | null;
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
  vendorId?: number;
};

export type IStagingPoItem = IPoItemWithRelations & {
  ordered_quantity: number;
  in_staging_quantity: number;
  is_line_fully_received: boolean;
};

export type IPoVendorReturn = {
  id: number;
  po_id: number;
  po_item_id: number;
  quantity: number;
  reason: string;
  returned_by: number;
  created_at: Date;
  item_name?: string | null;
  returned_by_name?: string | null;
};

export type IStagingPurchaseOrderSummary = IPurchaseOrderWithRelations & {
  fully_received_lines: number;
  total_lines: number;
};

export type IStagingPurchaseOrderDetail = IPurchaseOrderWithRelations & {
  fully_received_lines: number;
  total_lines: number;
  items: IStagingPoItem[];
  returns: IPoVendorReturn[];
};

export type IStagingReceiptItemPayload = {
  po_item_id: number;
  quantity: number;
};

export type IStagingAcceptItemPayload = {
  po_item_id: number;
  quantity: number;
  location_id: number;
};

export type IStagingAcceptPayload = {
  items: IStagingAcceptItemPayload[];
};

export type IVendorReturnItemPayload = {
  po_item_id: number;
  quantity: number;
  reason: string;
};

export type IStagingPurchaseOrderFilters = {
  searchTerm?: string;
  status?: PurchaseOrderStatus;
};
