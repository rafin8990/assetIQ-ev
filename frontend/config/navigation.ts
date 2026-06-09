import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
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
        title: "Procurement",
        icon: ShoppingCart,
        children: [
          { title: "Requisition", href: "/requisitions" },
          { title: "Purchase Order", href: "/purchase-orders" },
          { title: "Stock", href: "/stock" },
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
