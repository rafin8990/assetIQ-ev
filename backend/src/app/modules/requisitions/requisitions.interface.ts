export type RequisitionStatus =
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'ordered';

export type IRequisition = {
  id: number;
  req_id: string;
  description: string | null;
  created_by: number;
  approved_by: number | null;
  status: RequisitionStatus;
  attachment: string | null;
  created_at: Date;
  updated_at: Date;
};

export type IRequisitionItem = {
  id: number;
  requisition_id: number;
  item_id: number;
  quantity: number;
  unit_id: number;
  created_at: Date;
  updated_at: Date;
};

export type IRequisitionItemWithRelations = IRequisitionItem & {
  item_name?: string | null;
  unit_name?: string | null;
};

export type IRequisitionWithRelations = IRequisition & {
  created_by_name?: string | null;
  approved_by_name?: string | null;
  items: IRequisitionItemWithRelations[];
};

export type IRequisitionItemPayload = {
  item_id: number;
  quantity: number;
  unit_id: number;
};

export type ICreateRequisitionPayload = {
  description?: string | null;
  created_by: number;
  approved_by?: number | null;
  status?: RequisitionStatus;
  items: IRequisitionItemPayload[];
};

export type IUpdateRequisitionPayload = {
  description?: string | null;
  created_by?: number;
  approved_by?: number | null;
  status?: RequisitionStatus;
  attachment?: string | null;
  items?: IRequisitionItemPayload[];
};

export type IRequisitionFilters = {
  searchTerm?: string;
  status?: RequisitionStatus;
  createdBy?: number;
};
