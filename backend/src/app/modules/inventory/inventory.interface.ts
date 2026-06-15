export type StockLotSourceType = 'po_accept' | 'manual' | 'transfer' | 'return';

export type StockLotConsumptionType = 'out_request' | 'transfer' | 'adjustment';

export type IStockLot = {
  id: number;
  item_id: number;
  location_id: number;
  vendor_id: number | null;
  po_id: number | null;
  po_item_id: number | null;
  quantity: number;
  quantity_remaining: number;
  unit_id: number | null;
  source_type: StockLotSourceType;
  source_id: number | null;
  received_at: Date;
  created_at: Date;
  updated_at: Date;
};

export type IStockLotWithRelations = IStockLot & {
  item_name?: string | null;
  unit_name?: string | null;
  vendor_name?: string | null;
  vendor_company_name?: string | null;
  location_name?: string | null;
  location_code?: string | null;
  po_number?: string | null;
};

export type ICreateStockLotPayload = {
  item_id: number;
  location_id: number;
  vendor_id?: number | null;
  po_id?: number | null;
  po_item_id?: number | null;
  quantity: number;
  unit_id?: number | null;
  source_type: StockLotSourceType;
  source_id?: number | null;
};

export type IConsumedLotChunk = {
  lot_id: number;
  quantity: number;
  vendor_id: number | null;
  po_id: number | null;
  po_item_id: number | null;
  unit_id: number | null;
};

export type ILocationStockRow = {
  location_id: number;
  location_name: string | null;
  location_code: string | null;
  item_id: number;
  item_name: string | null;
  vendor_id: number | null;
  vendor_name: string | null;
  vendor_company_name: string | null;
  quantity: number;
  unit_id: number | null;
  unit_name: string | null;
};

export type ITotalStockRow = {
  item_id: number;
  item_name: string | null;
  vendor_id: number | null;
  vendor_name: string | null;
  vendor_company_name: string | null;
  quantity: number;
  unit_id: number | null;
  unit_name: string | null;
};

export type ITotalStockLocationBreakdown = {
  location_id: number;
  location_name: string | null;
  quantity: number;
};

export type IInventoryFilters = {
  searchTerm?: string;
  locationId?: number;
  itemId?: number;
  vendorId?: number;
};

export type ICreateManualLotPayload = {
  item_id: number;
  location_id: number;
  vendor_id?: number | null;
  quantity: number;
  unit_id?: number | null;
};
