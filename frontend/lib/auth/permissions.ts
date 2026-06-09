import {
  PERMISSION_DEFINITIONS,
  ROUTE_PERMISSIONS,
  type PermissionDefinition,
} from "@/config/permissions"
import type {
  NavLinkItem,
  NavSection,
  NavSubItem,
} from "@/config/navigation"
import type { User } from "@/types/users"

export function isSuperAdmin(user: Pick<User, "role"> | null | undefined) {
  return user?.role === "super_admin"
}

export function hasPermission(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  permissionKey: string
) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  return user.permissions?.includes(permissionKey) ?? false
}

export function hasAnyPermission(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  permissionKeys: string[]
) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  return permissionKeys.some(key => user.permissions?.includes(key))
}

function filterNavSubItems(
  items: NavSubItem[],
  permissions: string[],
  isSuper: boolean
): NavSubItem[] {
  return items
    .map(item => {
      if (item.children?.length) {
        const children = filterNavSubItems(item.children, permissions, isSuper)
        if (children.length === 0) return null
        return { ...item, children }
      }

      if (!item.href) return null

      const routeKey = getRoutePermissionKeyByHref(item.href)
      if (!routeKey) return item
      if (isSuper || permissions.includes(routeKey)) return item
      return null
    })
    .filter((item): item is NavSubItem => item !== null)
}

export function filterNavByPermissions(
  sections: NavSection[],
  user: Pick<User, "role" | "permissions"> | null | undefined
): NavSection[] {
  if (!user) return []
  if (isSuperAdmin(user)) return sections

  const permissions = user.permissions ?? []

  return sections
    .map(section => ({
      ...section,
      items: section.items
        .map(item => {
          if (item.children?.length) {
            const children = filterNavSubItems(
              item.children,
              permissions,
              false
            )
            if (children.length === 0) return null
            return { ...item, children } satisfies NavLinkItem
          }

          if (!item.href) return null

          const routeKey = getRoutePermissionKeyByHref(item.href)
          if (!routeKey) return item
          if (permissions.includes(routeKey)) return item
          return null
        })
        .filter((item): item is NavLinkItem => item !== null),
    }))
    .filter(section => section.items.length > 0)
}

const hrefToPermissionKey = new Map(
  ROUTE_PERMISSIONS.filter(p => p.href).map(p => [p.href!, p.key])
)

export function getRoutePermissionKeyByHref(href: string) {
  return hrefToPermissionKey.get(href)
}

export function getRoutePermissionKey(pathname: string): string | null {
  if (pathname === "/") {
    return "route.dashboard"
  }

  const sortedRoutes = [...ROUTE_PERMISSIONS]
    .filter((p): p is PermissionDefinition & { href: string } => Boolean(p.href))
    .sort((a, b) => b.href.length - a.href.length)

  for (const route of sortedRoutes) {
    if (pathname === route.href || pathname.startsWith(`${route.href}/`)) {
      return route.key
    }
  }

  return null
}

export function canAccessRoute(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  pathname: string
) {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  const requiredKey = getRoutePermissionKey(pathname)
  if (!requiredKey) return true

  return hasPermission(user, requiredKey)
}

export function getPermissionGroupsFromRegistry() {
  const groupNames = [...new Set(PERMISSION_DEFINITIONS.map(p => p.group))]

  return groupNames.map(group => ({
    group,
    routes: PERMISSION_DEFINITIONS.filter(
      p => p.group === group && p.type === "route"
    ),
    actions: PERMISSION_DEFINITIONS.filter(
      p => p.group === group && p.type === "action"
    ),
  }))
}
