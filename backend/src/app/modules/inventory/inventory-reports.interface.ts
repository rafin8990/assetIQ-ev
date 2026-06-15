export type IInventoryMovementReportSummary = {
  movement_count: number;
  item_count?: number;
  total_requested_quantity: number;
  total_confirmed_quantity: number;
};

export type IMainStockUpdateReportSummary = {
  entry_count: number;
  item_count?: number;
  total_quantity: number;
};

export type IDailyMovementReportItem = {
  movement_number: string;
  movement_date: string;
  movement_status: string;
  source_location_name: string | null;
  destination_location_name: string | null;
  item_name: string | null;
  requested_quantity: number;
  confirmed_quantity: number | null;
  unit_name: string | null;
  requested_by_name: string | null;
};

export type IDailyMovementReport = {
  date: string;
  items: IDailyMovementReportItem[];
  summary: IInventoryMovementReportSummary;
};

export type IDateRangeMovementReportRow = {
  id: number;
  movement_number: string;
  created_at: string;
  status: string;
  source_location_name: string | null;
  destination_location_name: string | null;
  item_count: number;
  total_requested_quantity: number;
  total_confirmed_quantity: number;
  requested_by_name: string | null;
};

export type IDateRangeMovementReport = {
  from_date: string;
  to_date: string;
  movements: IDateRangeMovementReportRow[];
  summary: IInventoryMovementReportSummary;
};

export type IMonthwiseMovementReportRow = {
  month: number;
  month_label: string;
  movement_count: number;
  item_count: number;
  total_requested_quantity: number;
  total_confirmed_quantity: number;
};

export type IMonthwiseMovementReport = {
  year: number;
  months: IMonthwiseMovementReportRow[];
  summary: IInventoryMovementReportSummary;
};

export type IUserWiseMovementReportRow = {
  user_id: number;
  user_name: string | null;
  movement_count: number;
  item_count: number;
  total_requested_quantity: number;
  total_confirmed_quantity: number;
};

export type IUserWiseMovementReport = {
  from_date: string;
  to_date: string;
  user_id?: number;
  users: IUserWiseMovementReportRow[];
  summary: IInventoryMovementReportSummary;
};

export type IMainStockUpdateReportItem = {
  created_at: string;
  item_name: string | null;
  vendor_name: string | null;
  quantity: number;
  unit_name: string | null;
  source_type: string;
  reference: string | null;
};

export type IMainStockUpdateReport = {
  from_date: string;
  to_date: string;
  location_name: string;
  items: IMainStockUpdateReportItem[];
  summary: IMainStockUpdateReportSummary;
};
