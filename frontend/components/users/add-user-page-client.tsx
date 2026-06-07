"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, UserPlus } from "lucide-react"

import {
  selectClassName,
  USER_ROLE_OPTIONS,
} from "@/components/users/user-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { createUser } from "@/services/users"
import type { UserRole } from "@/types/users"

export function AddUserPageClient() {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [mobileNo, setMobileNo] = React.useState("")
  const [image, setImage] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("user")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Name is required")
      return
    }

    if (!email.trim() && !mobileNo.trim()) {
      setError("Either email or mobile number is required")
      return
    }

    if (!password.trim() || password.trim().length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createUser({
        name: trimmedName,
        email: email.trim() || null,
        mobile_no: mobileNo.trim() || null,
        image: image.trim() || null,
        password: password.trim(),
        role,
      })

      router.push("/users")
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to create user"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            Add User
          </h2>
          <p className="text-[#8b95a5]">
            Create a new user account with role and login credentials.
          </p>
        </div>
        <Link href="/users" className="shrink-0">
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft data-icon="inline-start" />
            Back to List
          </Button>
        </Link>
      </div>

      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-[#4DC591]" />
            <h3 className="text-base font-semibold text-white">New User</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-2">
            <label htmlFor="add-name" className="text-sm font-medium text-[#373B44]">
              Name *
            </label>
            <Input
              id="add-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="add-email" className="text-sm font-medium text-[#373B44]">
                Email
              </label>
              <Input
                id="add-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="add-mobile" className="text-sm font-medium text-[#373B44]">
                Mobile Number
              </label>
              <Input
                id="add-mobile"
                value={mobileNo}
                onChange={(event) => setMobileNo(event.target.value)}
                placeholder="+88017..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          <p className="text-xs text-[#8b95a5]">
            At least one of email or mobile number is required for login.
          </p>

          <div className="space-y-2">
            <label htmlFor="add-image" className="text-sm font-medium text-[#373B44]">
              Image URL
            </label>
            <Input
              id="add-image"
              value={image}
              onChange={(event) => setImage(event.target.value)}
              placeholder="https://..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="add-role" className="text-sm font-medium text-[#373B44]">
                Role *
              </label>
              <select
                id="add-role"
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
              <label htmlFor="add-password" className="text-sm font-medium text-[#373B44]">
                Password *
              </label>
              <Input
                id="add-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-[#e8eaed] pt-5">
            <Link href="/users">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
