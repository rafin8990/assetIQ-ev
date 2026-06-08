import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavSubItem = {
  title: string
  href: string
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
        ],
      },
      {
        title: "User Management",
        icon: Users,
        children: [
          { title: "Add User", href: "/users/add" },
          { title: "List of User", href: "/users" },
          { title: "Admin Management", href: "/users/admins" },
        ],
      },
    ],
  },
]

export const sidebarNavItems = sidebarNavSections.flatMap((section) =>
  section.items.flatMap((item) =>
    item.children?.length
      ? item.children.map((child) => ({ title: child.title, href: child.href }))
      : item.href
        ? [{ title: item.title, href: item.href }]
        : []
  )
)

export const APP_VERSION = "1.2.74"
