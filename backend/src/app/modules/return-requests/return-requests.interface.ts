export type ReturnRequestStatus = 'pending' | 'approved' | 'cancelled';

export type IReturnRequest = {
  id: number;
  return_id: string;
  out_request_id: number;
  description: string | null;
  status: ReturnRequestStatus;
  requested_by: number;
  approved_by: number | null;
  created_at: Date;
  updated_at: Date;
};

export type IReturnRequestItem = {
  id: number;
  return_request_id: number;
  out_request_item_id: number;
  item_id: number;
  return_quantity: number;
  unit_id: number | null;
  created_at: Date;
  updated_at: Date;
};

export type IReturnRequestItemWithRelations = IReturnRequestItem & {
  item_name?: string | null;
  unit_name?: string | null;
  out_quantity?: number | null;
  already_returned_quantity?: number | null;
  returnable_quantity?: number | null;
};

export type IReturnRequestWithRelations = IReturnRequest & {
  out_request_request_id?: string | null;
  requested_by_name?: string | null;
  approved_by_name?: string | null;
  items: IReturnRequestItemWithRelations[];
};

export type IReturnRequestItemPayload = {
  out_request_item_id: number;
  item_id: number;
  return_quantity: number;
  unit_id?: number | null;
};

export type ICreateReturnRequestPayload = {
  out_request_id: number;
  description?: string | null;
  requested_by: number;
  items: IReturnRequestItemPayload[];
};

export type IUpdateReturnRequestPayload = {
  description?: string | null;
  requested_by?: number;
  items?: IReturnRequestItemPayload[];
};

export type IReturnRequestFilters = {
  searchTerm?: string;
  status?: ReturnRequestStatus;
  requestedBy?: number;
  outRequestId?: number;
};
