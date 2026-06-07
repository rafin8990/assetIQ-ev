"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Search,
  Shield,
} from "lucide-react"

import {
  formatDate,
  formatRole,
  selectClassName,
  USER_ROLE_OPTIONS,
} from "@/components/users/user-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ApiError } from "@/lib/api/client"
import { getAdminUsers, updateUser } from "@/services/users"
import type { User, UserRole } from "@/types/users"

export function AdminsPageClient() {
  const [admins, setAdmins] = React.useState<User[]>([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [selectedAdmin, setSelectedAdmin] = React.useState<User | null>(null)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [mobileNo, setMobileNo] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("admin")
  const [password, setPassword] = React.useState("")

  const fetchAdmins = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getAdminUsers({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })

      setAdmins(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load admin users"
      setError(message)
      setAdmins([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const openEditSheet = (admin: User) => {
    setSelectedAdmin(admin)
    setName(admin.name)
    setEmail(admin.email ?? "")
    setMobileNo(admin.mobile_no ?? "")
    setRole(admin.role)
    setPassword("")
    setFormError(null)
    setSheetOpen(true)
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedAdmin) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await updateUser(selectedAdmin.id, {
        name: name.trim(),
        email: email.trim() || null,
        mobile_no: mobileNo.trim() || null,
        role,
        ...(password.trim() ? { password: password.trim() } : {}),
      })

      setSheetOpen(false)
      await fetchAdmins()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to update admin"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const adminRoleOptions = USER_ROLE_OPTIONS.filter(
    (option) => option.value === "admin" || option.value === "super_admin"
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
          Admin Management
        </h2>
        <p className="text-[#8b95a5]">
          Manage admin and super admin accounts.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">Admin Users</h3>
                <p className="text-sm text-white/70">
                  {total} admin{total === 1 ? "" : "s"} total
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search admins..."
                  className="h-9 border-[#e8eaed] bg-white pl-9"
                />
              </div>
              <Button type="submit" variant="outline" className="bg-white">
                Search
              </Button>
            </form>
          </div>
        </div>

        {error && (
          <div className="border-b border-[#e8eaed] bg-red-50 px-5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">ID</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Name</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Email</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Mobile</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Role</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Created</th>
                <th className="px-5 py-3 text-right font-semibold text-[#373B44]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#8b95a5]">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading admins...
                    </span>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#8b95a5]">
                    No admin users found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="transition-colors hover:bg-[#f8f9fb]">
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {admin.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {admin.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {admin.email ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {admin.mobile_no ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-[#fff4e5] px-2.5 py-1 text-xs font-medium text-[#9a6700]">
                        {formatRole(admin.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSheet(admin)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#e8eaed] px-5 py-4">
          <p className="text-sm text-[#8b95a5]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Admin</SheetTitle>
            <SheetDescription>Update admin account details.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label htmlFor="admin-name" className="text-sm font-medium text-[#373B44]">
                Name
              </label>
              <Input
                id="admin-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-email" className="text-sm font-medium text-[#373B44]">
                Email
              </label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-mobile" className="text-sm font-medium text-[#373B44]">
                Mobile Number
              </label>
              <Input
                id="admin-mobile"
                value={mobileNo}
                onChange={(event) => setMobileNo(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-role" className="text-sm font-medium text-[#373B44]">
                Role
              </label>
              <select
                id="admin-role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className={selectClassName}
                disabled={isSubmitting}
              >
                {adminRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium text-[#373B44]">
                New Password (optional)
              </label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Save Changes
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
