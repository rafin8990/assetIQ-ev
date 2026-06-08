export type IStock = {
  id: number;
  item_id: number;
  quantity: number;
  unit_id: number | null;
  created_at: Date;
  updated_at: Date;
};

export type IStockWithRelations = IStock & {
  item_name?: string | null;
  unit_name?: string | null;
};

export type IStockFilters = {
  searchTerm?: string;
  itemId?: number;
};

export type IStockIncreaseItem = {
  item_id: number;
  quantity: number;
  unit_id?: number | null;
};

export type ICreateManualStockPayload = {
  item_id: number;
  quantity: number;
  unit_id?: number | null;
};

export type IUpdateStockPayload = {
  quantity?: number;
  unit_id?: number | null;
};

export type IBulkStockImportError = {
  row: number;
  message: string;
};

export type IBulkStockImportResult = {
  processed: number;
  failed: number;
  errors: IBulkStockImportError[];
};
