import type { PermissionDefinition } from "@/config/permissions"

export type PermissionGroup = {
  group: string
  routes: PermissionDefinition[]
  actions: PermissionDefinition[]
}

export type PermissionsRegistry = {
  groups: PermissionGroup[]
  allKeys: string[]
}

export type SetUserPermissionsPayload = {
  permissionKeys: string[]
}
