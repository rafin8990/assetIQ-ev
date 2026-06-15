"use client"

import * as React from "react"
import { Loader2, Save, Search, Shield } from "lucide-react"

import {
  getPermissionGroupKeys,
  getPermissionSectionKeys,
  PermissionGroupCard,
} from "@/components/users/permission-group-card"
import {
  formatRole,
  selectClassName,
} from "@/components/users/user-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PERMISSION_ACTION_MANAGE_PERMISSIONS } from "@/config/permissions"
import { ApiError } from "@/lib/api/client"
import { hasPermission } from "@/lib/auth/permissions"
import { getAuthUser } from "@/lib/auth/token"
import {
  getPermissionsRegistry,
  getUserPermissions,
  setUserPermissions,
} from "@/services/permissions"
import { getUsers } from "@/services/users"
import type { PermissionGroup, PermissionRouteSection } from "@/types/permissions"
import type { User } from "@/types/users"

export function UserPermissionsPageClient() {
  const authUser = getAuthUser()
  const canManage = hasPermission(authUser, PERMISSION_ACTION_MANAGE_PERMISSIONS)

  const [users, setUsers] = React.useState<User[]>([])
  const [groups, setGroups] = React.useState<PermissionGroup[]>([])
  const [allKeys, setAllKeys] = React.useState<string[]>([])
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingPermissions, setIsLoadingPermissions] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!canManage) {
      setIsLoading(false)
      return
    }

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [usersResult, registry] = await Promise.all([
          getUsers({ limit: 500, sortBy: "name", sortOrder: "asc" }),
          getPermissionsRegistry(),
        ])

        setUsers(usersResult.data)
        setGroups(registry.groups)
        setAllKeys(registry.allKeys)

        const firstNonSuperAdmin = usersResult.data.find(
          user => user.role !== "super_admin"
        )
        if (firstNonSuperAdmin) {
          setSelectedUserId(String(firstNonSuperAdmin.id))
        }
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.errorMessages?.[0]?.message || err.message
            : err instanceof Error
              ? err.message
              : "Failed to load permissions registry"
        setError(message)
        setGroups([])
        setAllKeys([])
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [canManage])

  React.useEffect(() => {
    if (!selectedUserId || !canManage) return

    const loadUserPermissions = async () => {
      setIsLoadingPermissions(true)
      setError(null)
      setSuccess(null)

      try {
        const keys = await getUserPermissions(Number(selectedUserId))
        setSelectedKeys(new Set(keys))
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.errorMessages?.[0]?.message || err.message
            : err instanceof Error
              ? err.message
              : "Failed to load user permissions"
        setError(message)
      } finally {
        setIsLoadingPermissions(false)
      }
    }

    void loadUserPermissions()
  }, [selectedUserId, canManage])

  const selectedUser = users.find(user => String(user.id) === selectedUserId)

  const routeNameByKey = React.useMemo(() => {
    const map = new Map<string, string>()

    for (const group of groups) {
      for (const section of group.routeSections) {
        for (const route of section.routes) {
          map.set(route.key, route.name)
        }
      }
    }

    return map
  }, [groups])

  const staleKeys = React.useMemo(
    () =>
      [...selectedKeys].filter(
        key => allKeys.length > 0 && !allKeys.includes(key)
      ),
    [allKeys, selectedKeys]
  )

  const visibleGroupCount = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return groups.length

    return groups.filter(group => {
      const hasRouteMatch = group.routeSections.some(section =>
        section.routes.some(
          route =>
            route.name.toLowerCase().includes(query) ||
            route.key.toLowerCase().includes(query) ||
            (route.href?.toLowerCase().includes(query) ?? false)
        )
      )
      const hasActionMatch = group.actions.some(
        action =>
          action.name.toLowerCase().includes(query) ||
          action.key.toLowerCase().includes(query)
      )
      return hasRouteMatch || hasActionMatch
    }).length
  }, [groups, searchTerm])

  const toggleKey = (key: string, checked: boolean) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  const toggleKeys = (keys: string[], checked: boolean) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      for (const key of keys) {
        if (checked) {
          next.add(key)
        } else {
          next.delete(key)
        }
      }
      return next
    })
  }

  const toggleGroup = (group: PermissionGroup, checked: boolean) => {
    toggleKeys(getPermissionGroupKeys(group), checked)
  }

  const toggleSection = (section: PermissionRouteSection, checked: boolean) => {
    toggleKeys(getPermissionSectionKeys(section), checked)
  }

  const handleSave = async () => {
    if (!selectedUserId) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const validKeys = [...selectedKeys].filter(key => allKeys.includes(key))

      await setUserPermissions(Number(selectedUserId), {
        permissionKeys: validKeys,
      })
      setSelectedKeys(new Set(validKeys))
      setSuccess("Permissions saved successfully")
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save permissions"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!canManage) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-[#e8eaed] bg-white p-8 text-center">
        <Shield className="mb-3 size-10 text-[#8b95a5]" />
        <h2 className="text-lg font-semibold text-[#373B44]">Access restricted</h2>
        <p className="mt-2 max-w-md text-sm text-[#8b95a5]">
          You do not have permission to manage user permissions.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#4DC591]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            User Permissions
          </h2>
          <p className="mt-1 text-sm text-[#8b95a5]">
            Grant route and action access per user without changing their role.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!selectedUserId || isSaving || isLoadingPermissions || !groups.length}
          className="bg-[#4DC591] hover:bg-[#3db37f]"
        >
          {isSaving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Save Permissions
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-[#4DC591]/30 bg-[#e8f8f0] px-4 py-3 text-sm text-[#2d9f6f]">
          {success}
        </div>
      )}

      <div className="rounded-lg border border-[#e8eaed] bg-white p-6">
        <label className="mb-2 block text-sm font-medium text-[#373B44]">
          Select User
        </label>
        <select
          className={selectClassName}
          value={selectedUserId}
          onChange={event => setSelectedUserId(event.target.value)}
        >
          <option value="">Choose a user</option>
          {users
            .filter(user => user.role !== "super_admin")
            .map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({formatRole(user.role)})
                {user.email ? ` — ${user.email}` : ""}
              </option>
            ))}
        </select>

        {selectedUser && (
          <p className="mt-2 text-xs text-[#8b95a5]">
            Role: {formatRole(selectedUser.role)} — permissions apply on top of
            role. Super admins always have full access.
          </p>
        )}
      </div>

      {staleKeys.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Legacy permissions detected</p>
          <p className="mt-1 text-xs text-amber-700">
            These keys are assigned to the user but no longer exist in the
            current permission registry. They will be removed when you save.
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs">
            {staleKeys.map(key => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-[#e8eaed] bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-[#373B44]">
          Search permissions
        </label>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search by name, key, or route"
            className="pl-9"
          />
        </div>
      </div>

      {isLoadingPermissions ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-[#e8eaed] bg-white">
          <Loader2 className="size-6 animate-spin text-[#4DC591]" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-[#e8eaed] bg-white px-6 py-12 text-center text-sm text-[#8b95a5]">
          Permission registry could not be loaded.
        </div>
      ) : visibleGroupCount === 0 ? (
        <div className="rounded-lg border border-[#e8eaed] bg-white px-6 py-12 text-center text-sm text-[#8b95a5]">
          No permissions match your search.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <PermissionGroupCard
              key={group.group}
              group={group}
              selectedKeys={selectedKeys}
              routeNameByKey={routeNameByKey}
              searchTerm={searchTerm.trim()}
              onToggleKey={toggleKey}
              onToggleGroup={toggleGroup}
              onToggleSection={toggleSection}
            />
          ))}
        </div>
      )}
    </div>
  )
}
