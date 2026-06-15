import type { PermissionDefinition, PermissionType } from "@/types/permissions"

export type { PermissionDefinition, PermissionType }

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: "route.dashboard",
    name: "Dashboard",
    type: "route",
    group: "Dashboard",
    href: "/",
  },
  {
    key: "route.assets.category",
    name: "Category",
    type: "route",
    group: "Assets",
    href: "/assets/category",
  },
  {
    key: "route.assets.sub_category",
    name: "Sub category",
    type: "route",
    group: "Assets",
    href: "/assets/sub-category",
  },
  {
    key: "route.assets.brand",
    name: "Brand",
    type: "route",
    group: "Assets",
    href: "/assets/brand",
  },
  {
    key: "route.assets.items",
    name: "Items",
    type: "route",
    group: "Assets",
    href: "/assets/items",
  },
  {
    key: "route.assets.units",
    name: "Units",
    type: "route",
    group: "Assets",
    href: "/assets/units",
  },
  {
    key: "route.procurement.requisitions",
    name: "Requisition",
    type: "route",
    group: "Procurement",
    href: "/requisitions",
  },
  {
    key: "route.procurement.purchase_orders",
    name: "Purchase Order",
    type: "route",
    group: "Procurement",
    href: "/purchase-orders",
  },
  {
    key: "route.procurement.po_receiving",
    name: "PO Receiving",
    type: "route",
    group: "Procurement",
    href: "/procurement/po-receiving",
  },
  {
    key: "route.procurement.stock",
    name: "Stock",
    type: "route",
    group: "Inventory",
    href: "/stock",
  },
  {
    key: "route.inventory.location_stock",
    name: "Location Stock",
    type: "route",
    group: "Inventory",
    href: "/inventory/location-stock",
  },
  {
    key: "route.inventory.total_stock",
    name: "Total Stock",
    type: "route",
    group: "Inventory",
    href: "/inventory/total-stock",
  },
  {
    key: "route.inventory.stock_movements",
    name: "Stock Movements",
    type: "route",
    group: "Inventory",
    href: "/inventory/stock-movements",
  },
  {
    key: "route.inventory.stock_movement_approval",
    name: "Movement Approval",
    type: "route",
    group: "Inventory",
    href: "/inventory/stock-movements/approval",
  },
  {
    key: "route.inventory.stock_movement_confirm",
    name: "Destination Confirm",
    type: "route",
    group: "Inventory",
    href: "/inventory/stock-movements/confirm",
  },
  {
    key: "route.inventory.locations",
    name: "Location",
    type: "route",
    group: "Inventory",
    href: "/locations",
  },
  {
    key: "route.inventory.reports.date_wise_movement",
    name: "Date-wise Movement History",
    type: "route",
    group: "Inventory",
    href: "/inventory/reports/date-wise-movement",
  },
  {
    key: "route.inventory.reports.date_range_movement",
    name: "Date Range Movement History",
    type: "route",
    group: "Inventory",
    href: "/inventory/reports/date-range-movement",
  },
  {
    key: "route.inventory.reports.user_wise_movement",
    name: "User-wise Movement History",
    type: "route",
    group: "Inventory",
    href: "/inventory/reports/user-wise-movement",
  },
  {
    key: "route.inventory.reports.main_stock_update",
    name: "Main Stock Update History",
    type: "route",
    group: "Inventory",
    href: "/inventory/reports/main-stock-update",
  },
  {
    key: "route.inventory.reports.monthwise_movement",
    name: "Monthly Movement Report",
    type: "route",
    group: "Inventory",
    href: "/inventory/reports/monthwise-movement",
  },
  {
    key: "route.procurement.vendor",
    name: "Vendor",
    type: "route",
    group: "Procurement",
    href: "/vendor",
  },
  {
    key: "route.procurement.reports.todays_purchase_order",
    name: "Today's Purchase Order Report",
    type: "route",
    group: "Procurement",
    href: "/procurement/reports/todays-purchase-order",
  },
  {
    key: "route.procurement.reports.date_wise",
    name: "Date Wise Report",
    type: "route",
    group: "Procurement",
    href: "/procurement/reports/date-wise",
  },
  {
    key: "route.procurement.reports.due_pay",
    name: "List of Due/Pay Report",
    type: "route",
    group: "Procurement",
    href: "/procurement/reports/due-pay",
  },
  {
    key: "route.procurement.reports.monthwise",
    name: "Monthwise Report",
    type: "route",
    group: "Procurement",
    href: "/procurement/reports/monthwise",
  },
  {
    key: "action.requisitions.approve",
    name: "Approve Requisition",
    type: "action",
    group: "Procurement",
    module: "requisitions",
    relatedRouteKey: "route.procurement.requisitions",
  },
  {
    key: "action.purchase_orders.approve",
    name: "Approve Purchase Order",
    type: "action",
    group: "Procurement",
    module: "purchase_orders",
    relatedRouteKey: "route.procurement.purchase_orders",
  },
  {
    key: "action.purchase_orders.receive",
    name: "Receive Purchase Order",
    type: "action",
    group: "Procurement",
    module: "purchase_orders",
    relatedRouteKey: "route.procurement.purchase_orders",
  },
  {
    key: "action.stocks.manage",
    name: "Manage Stock",
    type: "action",
    group: "Inventory",
    module: "stocks",
    relatedRouteKey: "route.inventory.total_stock",
  },
  {
    key: "action.stock_movements.approve",
    name: "Approve Stock Movement",
    type: "action",
    group: "Inventory",
    module: "stock_movements",
    relatedRouteKey: "route.inventory.stock_movement_approval",
  },
  {
    key: "action.stock_movements.ready",
    name: "Mark Stock Movement Ready",
    type: "action",
    group: "Inventory",
    module: "stock_movements",
    relatedRouteKey: "route.inventory.stock_movements",
  },
  {
    key: "action.stock_movements.transfer",
    name: "Transfer Stock Movement",
    type: "action",
    group: "Inventory",
    module: "stock_movements",
    relatedRouteKey: "route.inventory.stock_movements",
  },
  {
    key: "action.stock_movements.confirm",
    name: "Confirm Stock Movement",
    type: "action",
    group: "Inventory",
    module: "stock_movements",
    relatedRouteKey: "route.inventory.stock_movement_confirm",
  },
  {
    key: "route.outbound.out_request",
    name: "Out Request",
    type: "route",
    group: "Outbound",
    href: "/outbound/out-request",
  },
  {
    key: "route.outbound.request_approval",
    name: "Request Approval",
    type: "route",
    group: "Outbound",
    href: "/outbound/request-approval",
  },
  {
    key: "route.outbound.return",
    name: "Return",
    type: "route",
    group: "Outbound",
    href: "/outbound/return",
  },
  {
    key: "route.outbound.reports.todays",
    name: "Today's Report",
    type: "route",
    group: "Outbound",
    href: "/outbound/reports/todays-report",
  },
  {
    key: "route.outbound.reports.date_wise",
    name: "Date Wise Report",
    type: "route",
    group: "Outbound",
    href: "/outbound/reports/date-wise",
  },
  {
    key: "route.outbound.reports.monthly",
    name: "Monthly Report",
    type: "route",
    group: "Outbound",
    href: "/outbound/reports/monthly",
  },
  {
    key: "route.outbound.reports.user_wise",
    name: "User Wise Report",
    type: "route",
    group: "Outbound",
    href: "/outbound/reports/user-wise",
  },
  {
    key: "route.outbound.reports.return",
    name: "Return Report",
    type: "route",
    group: "Outbound",
    href: "/outbound/reports/return-report",
  },
  {
    key: "action.out_requests.approve",
    name: "Approve Out Request",
    type: "action",
    group: "Outbound",
    module: "out_requests",
    relatedRouteKey: "route.outbound.request_approval",
  },
  {
    key: "action.out_requests.process_out",
    name: "Process Out (Mark Out)",
    type: "action",
    group: "Outbound",
    module: "out_requests",
    relatedRouteKey: "route.outbound.out_request",
  },
  {
    key: "action.out_requests.delete_any",
    name: "Delete Any Out Request",
    type: "action",
    group: "Outbound",
    module: "out_requests",
    relatedRouteKey: "route.outbound.out_request",
  },
  {
    key: "action.returns.approve",
    name: "Approve Return",
    type: "action",
    group: "Outbound",
    module: "returns",
    relatedRouteKey: "route.outbound.return",
  },
  {
    key: "action.returns.delete_any",
    name: "Delete Any Return",
    type: "action",
    group: "Outbound",
    module: "returns",
    relatedRouteKey: "route.outbound.return",
  },
  {
    key: "route.users.add",
    name: "Add User",
    type: "route",
    group: "User Management",
    href: "/users/add",
  },
  {
    key: "route.users.list",
    name: "List of User",
    type: "route",
    group: "User Management",
    href: "/users",
  },
  {
    key: "route.users.permissions",
    name: "User Permissions",
    type: "route",
    group: "User Management",
    href: "/users/permissions",
  },
  {
    key: "action.users.manage",
    name: "Manage Users",
    type: "action",
    group: "User Management",
    module: "users",
    relatedRouteKey: "route.users.list",
  },
  {
    key: "action.permissions.manage",
    name: "Manage Permissions",
    type: "action",
    group: "User Management",
    module: "permissions",
    relatedRouteKey: "route.users.permissions",
  },
]

export const ROUTE_PERMISSIONS = PERMISSION_DEFINITIONS.filter(
  p => p.type === "route"
)

export const ACTION_PERMISSIONS = PERMISSION_DEFINITIONS.filter(
  p => p.type === "action"
)

export const PERMISSION_ACTION_APPROVE_REQUISITION =
  "action.requisitions.approve"
export const PERMISSION_ACTION_APPROVE_PURCHASE_ORDER =
  "action.purchase_orders.approve"
export const PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER =
  "action.purchase_orders.receive"
export const PERMISSION_ACTION_MANAGE_STOCK = "action.stocks.manage"
export const PERMISSION_ACTION_STOCK_MOVEMENTS_APPROVE =
  "action.stock_movements.approve"
export const PERMISSION_ACTION_STOCK_MOVEMENTS_READY =
  "action.stock_movements.ready"
export const PERMISSION_ACTION_STOCK_MOVEMENTS_TRANSFER =
  "action.stock_movements.transfer"
export const PERMISSION_ACTION_STOCK_MOVEMENTS_CONFIRM =
  "action.stock_movements.confirm"
export const PERMISSION_ACTION_APPROVE_OUT_REQUEST =
  "action.out_requests.approve"
export const PERMISSION_ACTION_PROCESS_OUT = "action.out_requests.process_out"
export const PERMISSION_ACTION_DELETE_ANY_OUT_REQUEST =
  "action.out_requests.delete_any"
export const PERMISSION_ACTION_APPROVE_RETURN = "action.returns.approve"
export const PERMISSION_ACTION_DELETE_ANY_RETURN = "action.returns.delete_any"
export const PERMISSION_ACTION_MANAGE_USERS = "action.users.manage"
export const PERMISSION_ACTION_MANAGE_PERMISSIONS = "action.permissions.manage"
