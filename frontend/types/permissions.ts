export type PermissionType = "route" | "action"

export type PermissionDefinition = {
  key: string
  name: string
  type: PermissionType
  group: string
  href?: string
  module?: string
  relatedRouteKey?: string
}

export type PermissionRouteSection = {
  section: string
  routes: PermissionDefinition[]
}

export type PermissionGroup = {
  group: string
  routeSections: PermissionRouteSection[]
  actions: PermissionDefinition[]
}

export type PermissionsRegistry = {
  groups: PermissionGroup[]
  allKeys: string[]
}

export type SetUserPermissionsPayload = {
  permissionKeys: string[]
}
