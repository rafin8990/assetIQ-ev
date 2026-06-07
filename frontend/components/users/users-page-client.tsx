"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
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
import { deleteUser, getUsers, updateUser } from "@/services/users"
import type { User, UserRole } from "@/types/users"

export function UsersPageClient() {
  const [users, setUsers] = React.useState<User[]>([])
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
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [mobileNo, setMobileNo] = React.useState("")
  const [image, setImage] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("user")
  const [password, setPassword] = React.useState("")

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null)

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getUsers({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })

      setUsers(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load users"
      setError(message)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openEditSheet = (user: User) => {
    setSelectedUser(user)
    setName(user.name)
    setEmail(user.email ?? "")
    setMobileNo(user.mobile_no ?? "")
    setImage(user.image ?? "")
    setRole(user.role)
    setPassword("")
    setFormError(null)
    setSheetOpen(true)
  }

  const openDeleteSheet = (user: User) => {
    setUserToDelete(user)
    setFormError(null)
    setDeleteOpen(true)
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedUser) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setFormError("Name is required")
      return
    }

    if (!email.trim() && !mobileNo.trim()) {
      setFormError("Either email or mobile number is required")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      await updateUser(selectedUser.id, {
        name: trimmedName,
        email: email.trim() || null,
        mobile_no: mobileNo.trim() || null,
        image: image.trim() || null,
        role,
        ...(password.trim() ? { password: password.trim() } : {}),
      })

      setSheetOpen(false)
      await fetchUsers()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to update user"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteUser(userToDelete.id)
      setDeleteOpen(false)
      setUserToDelete(null)

      if (users.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchUsers()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete user"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            List of User
          </h2>
          <p className="text-[#8b95a5]">
            View, edit, and manage all registered users.
          </p>
        </div>
        <Link href="/users/add" className="shrink-0">
          <Button className="w-full sm:w-auto">
            <Plus data-icon="inline-start" />
            Add User
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">All Users</h3>
                <p className="text-sm text-white/70">
                  {total} user{total === 1 ? "" : "s"} total
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search name, email, mobile..."
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
          <table className="w-full min-w-[960px] text-left text-sm">
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
                      Loading users...
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#8b95a5]">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-[#f8f9fb]">
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {user.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {user.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {user.email ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {user.mobile_no ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-[#e8f8f0] px-2.5 py-1 text-xs font-medium text-[#2d6b52]">
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSheet(user)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteSheet(user)}
                        >
                          <Trash2 />
                          Delete
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
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>Update user details and role.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label htmlFor="user-name" className="text-sm font-medium text-[#373B44]">
                Name
              </label>
              <Input
                id="user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="user-email" className="text-sm font-medium text-[#373B44]">
                Email
              </label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="user-mobile" className="text-sm font-medium text-[#373B44]">
                Mobile Number
              </label>
              <Input
                id="user-mobile"
                value={mobileNo}
                onChange={(event) => setMobileNo(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="user-image" className="text-sm font-medium text-[#373B44]">
                Image URL
              </label>
              <Input
                id="user-image"
                value={image}
                onChange={(event) => setImage(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="user-role" className="text-sm font-medium text-[#373B44]">
                Role
              </label>
              <select
                id="user-role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className={selectClassName}
                disabled={isSubmitting}
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="user-password" className="text-sm font-medium text-[#373B44]">
                New Password (optional)
              </label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank to keep current password"
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

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete User</SheetTitle>
            <SheetDescription>
              This action cannot be undone.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {userToDelete?.name}
              </span>
              ?
            </p>
            {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          </div>

          <SheetFooter className="px-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Delete User
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
