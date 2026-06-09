export type IReturnReportSummary = {
  return_count: number;
  item_count: number;
  total_return_quantity: number;
};

export type IReturnReportRow = {
  return_id: string;
  out_request_id: string;
  return_date: string;
  status: string;
  item_name: string | null;
  return_quantity: number;
  unit_name: string | null;
  requested_by_name: string | null;
  approved_by_name: string | null;
};

export type IDateRangeReturnReport = {
  from_date: string;
  to_date: string;
  items: IReturnReportRow[];
  summary: IReturnReportSummary;
};
