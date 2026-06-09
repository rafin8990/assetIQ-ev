export type OutRequestStatus = 'pending' | 'approved' | 'cancelled' | 'out';

export type OutRequestItemStatus = 'pending' | 'partial' | 'out';

export type IOutRequest = {
  id: number;
  request_id: string;
  description: string | null;
  status: OutRequestStatus;
  requested_by: number;
  approved_by: number | null;
  out_by: number | null;
  created_at: Date;
  updated_at: Date;
};

export type IOutRequestItem = {
  id: number;
  out_request_id: number;
  item_id: number;
  requested_quantity: number;
  out_quantity: number | null;
  unit_id: number | null;
  status: OutRequestItemStatus;
  out_by: number | null;
  created_at: Date;
  updated_at: Date;
};

export type IOutRequestItemWithRelations = IOutRequestItem & {
  item_name?: string | null;
  unit_name?: string | null;
  available_quantity?: number | null;
};

export type IOutRequestWithRelations = IOutRequest & {
  requested_by_name?: string | null;
  approved_by_name?: string | null;
  out_by_name?: string | null;
  items: IOutRequestItemWithRelations[];
};

export type IOutRequestItemPayload = {
  item_id: number;
  requested_quantity: number;
  unit_id?: number | null;
};

export type ICreateOutRequestPayload = {
  description?: string | null;
  requested_by: number;
  items: IOutRequestItemPayload[];
};

export type IUpdateOutRequestPayload = {
  description?: string | null;
  requested_by?: number;
  items?: IOutRequestItemPayload[];
};

export type IProcessOutRequestItemPayload = {
  item_id: number;
  out_quantity?: number | null;
};

export type IProcessOutRequestPayload = {
  out_by: number;
  items?: IProcessOutRequestItemPayload[];
};

export type IOutRequestFilters = {
  searchTerm?: string;
  status?: OutRequestStatus;
  requestedBy?: number;
};
