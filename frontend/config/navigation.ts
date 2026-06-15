import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

export type NavSubItem = {
  title: string
  href?: string
  children?: NavSubItem[]
}

export type NavLinkItem = {
  title: string
  href?: string
  icon: LucideIcon
  children?: NavSubItem[]
}

export type NavSection = {
  label?: string
  items: NavLinkItem[]
}

export const sidebarNavSections: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Assets",
        icon: Package,
        children: [
          { title: "Category", href: "/assets/category" },
          { title: "Sub category", href: "/assets/sub-category" },
          { title: "Brand", href: "/assets/brand" },
          { title: "Items", href: "/assets/items" },
          { title: "Units", href: "/assets/units" },
        ],
      },
      {
        title: "Inventory",
        icon: Warehouse,
        children: [
          { title: "Location Stock", href: "/inventory/location-stock" },
          { title: "Total Stock", href: "/inventory/total-stock" },
          { title: "Stock Movements", href: "/inventory/stock-movements" },
          {
            title: "Movement Approval",
            href: "/inventory/stock-movements/approval",
          },
          {
            title: "Destination Confirm",
            href: "/inventory/stock-movements/confirm",
          },
          { title: "Location", href: "/locations" },
          {
            title: "Report",
            children: [
              {
                title: "Date-wise Movement History",
                href: "/inventory/reports/date-wise-movement",
              },
              {
                title: "Date Range Movement History",
                href: "/inventory/reports/date-range-movement",
              },
              {
                title: "User-wise Movement History",
                href: "/inventory/reports/user-wise-movement",
              },
              {
                title: "Main Stock Update History",
                href: "/inventory/reports/main-stock-update",
              },
              {
                title: "Monthly Movement Report",
                href: "/inventory/reports/monthwise-movement",
              },
            ],
          },
        ],
      },
      {
        title: "Procurement",
        icon: ShoppingCart,
        children: [
          { title: "Requisition", href: "/requisitions" },
          { title: "Purchase Order", href: "/purchase-orders" },
          { title: "PO Receiving", href: "/procurement/po-receiving" },
          { title: "Vendor", href: "/vendor" },
          {
            title: "Report",
            children: [
              {
                title: "Today's Purchase Order Report",
                href: "/procurement/reports/todays-purchase-order",
              },
              {
                title: "Date Wise Report",
                href: "/procurement/reports/date-wise",
              },
              {
                title: "List of Due/Pay Report",
                href: "/procurement/reports/due-pay",
              },
              {
                title: "Monthwise Report",
                href: "/procurement/reports/monthwise",
              },
            ],
          },
        ],
      },
      {
        title: "Outbound",
        icon: Truck,
        children: [
          { title: "Out Request", href: "/outbound/out-request" },
          { title: "Request Approval", href: "/outbound/request-approval" },
          { title: "Return", href: "/outbound/return" },
          {
            title: "Report",
            children: [
              {
                title: "Today's Report",
                href: "/outbound/reports/todays-report",
              },
              {
                title: "Date Wise Report",
                href: "/outbound/reports/date-wise",
              },
              {
                title: "Monthly Report",
                href: "/outbound/reports/monthly",
              },
              {
                title: "User Wise Report",
                href: "/outbound/reports/user-wise",
              },
              {
                title: "Return Report",
                href: "/outbound/reports/return-report",
              },
            ],
          },
        ],
      },
      {
        title: "User Management",
        icon: Users,
        children: [
          { title: "Add User", href: "/users/add" },
          { title: "List of User", href: "/users" },
          { title: "User Permissions", href: "/users/permissions" },
        ],
      },
    ],
  },
]

function flattenNavSubItems(items: NavSubItem[]): { title: string; href: string }[] {
  return items.flatMap((item) =>
    item.href
      ? [{ title: item.title, href: item.href }]
      : item.children?.length
        ? flattenNavSubItems(item.children)
        : []
  )
}

export const sidebarNavItems = sidebarNavSections.flatMap((section) =>
  section.items.flatMap((item) =>
    item.children?.length
      ? flattenNavSubItems(item.children)
      : item.href
        ? [{ title: item.title, href: item.href }]
        : []
  )
)

export const APP_VERSION = "1.2.74"
