"use client"

import * as React from "react"
import { Loader2, Save, Shield } from "lucide-react"

import { selectClassName } from "@/components/users/user-constants"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { getPermissionGroupsFromRegistry, hasPermission } from "@/lib/auth/permissions"
import { getAuthUser } from "@/lib/auth/token"
import {
  getPermissionsRegistry,
  getUserPermissions,
  setUserPermissions,
} from "@/services/permissions"
import { getUsers } from "@/services/users"
import { PERMISSION_ACTION_MANAGE_PERMISSIONS } from "@/config/permissions"
import type { PermissionGroup } from "@/types/permissions"
import type { User } from "@/types/users"
import { formatRole } from "@/components/users/user-constants"

export function UserPermissionsPageClient() {
  const authUser = getAuthUser()
  const canManage = hasPermission(authUser, PERMISSION_ACTION_MANAGE_PERMISSIONS)

  const [users, setUsers] = React.useState<User[]>([])
  const [groups, setGroups] = React.useState<PermissionGroup[]>([])
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set())
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

        const firstNonSuperAdmin = usersResult.data.find(
          u => u.role !== "super_admin"
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
              : "Failed to load data"
        setError(message)
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

  const selectedUser = users.find(u => String(u.id) === selectedUserId)

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

  const toggleGroup = (group: PermissionGroup, checked: boolean) => {
    const keys = [
      ...group.routes.map(r => r.key),
      ...group.actions.map(a => a.key),
    ]

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

  const isGroupFullySelected = (group: PermissionGroup) => {
    const keys = [
      ...group.routes.map(r => r.key),
      ...group.actions.map(a => a.key),
    ]
    return keys.length > 0 && keys.every(key => selectedKeys.has(key))
  }

  const handleSave = async () => {
    if (!selectedUserId) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await setUserPermissions(Number(selectedUserId), {
        permissionKeys: [...selectedKeys],
      })
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
          disabled={!selectedUserId || isSaving || isLoadingPermissions}
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
          onChange={e => setSelectedUserId(e.target.value)}
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

      {isLoadingPermissions ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-[#e8eaed] bg-white">
          <Loader2 className="size-6 animate-spin text-[#4DC591]" />
        </div>
      ) : (
        <div className="space-y-4">
          {(groups.length ? groups : getPermissionGroupsFromRegistry()).map(
            group => {
              const groupKeys = [
                ...group.routes.map(r => r.key),
                ...group.actions.map(a => a.key),
              ]
              const selectedInGroup = groupKeys.filter(key =>
                selectedKeys.has(key)
              ).length

              return (
                <div
                  key={group.group}
                  className="rounded-lg border border-[#e8eaed] bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaed] px-5 py-4">
                    <div>
                      <h3 className="font-semibold text-[#373B44]">
                        {group.group}
                      </h3>
                      <p className="text-xs text-[#8b95a5]">
                        {selectedInGroup} of {groupKeys.length} selected
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleGroup(group, true)}
                      >
                        Select all
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleGroup(group, false)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    {group.routes.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b95a5]">
                          Routes
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {group.routes.map(route => (
                            <label
                              key={route.key}
                              className="flex cursor-pointer items-center gap-2 rounded-md border border-[#e8eaed] px-3 py-2 text-sm hover:bg-[#f8f9fa]"
                            >
                              <input
                                type="checkbox"
                                className="size-4 rounded border-[#d0d5dd] accent-[#4DC591]"
                                checked={selectedKeys.has(route.key)}
                                onChange={e =>
                                  toggleKey(route.key, e.target.checked)
                                }
                              />
                              <span className="text-[#373B44]">{route.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {group.actions.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b95a5]">
                          Actions
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {group.actions.map(action => (
                            <label
                              key={action.key}
                              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-[#d0d5dd] px-3 py-2 text-sm hover:bg-[#f8f9fa]"
                            >
                              <input
                                type="checkbox"
                                className="size-4 rounded border-[#d0d5dd] accent-[#4DC591]"
                                checked={selectedKeys.has(action.key)}
                                onChange={e =>
                                  toggleKey(action.key, e.target.checked)
                                }
                              />
                              <span className="text-[#373B44]">
                                {action.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }
          )}
        </div>
      )}
    </div>
  )
}
