"use client"

import * as React from "react"
import {
  ChevronDown,
  KeyRound,
  Loader2,
  LogOut,
  UserRound,
} from "lucide-react"

import { formatRole } from "@/components/users/user-constants"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { getAuthUser, getUserInitials } from "@/lib/auth/token"
import {
  changePassword,
  getProfile,
  logout,
  updateProfile,
} from "@/services/auth"
import type { User } from "@/types/users"

export function UserAccountMenu() {
  const [authUser, setAuthUser] = React.useState<User | null>(() => getAuthUser())
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false)

  const [profileOpen, setProfileOpen] = React.useState(false)
  const [passwordOpen, setPasswordOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [mobileNo, setMobileNo] = React.useState("")
  const [image, setImage] = React.useState("")

  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const refreshProfile = React.useCallback(async () => {
    setIsLoadingProfile(true)
    try {
      const user = await getProfile()
      setAuthUser(user)
    } catch {
      const cachedUser = getAuthUser()
      if (cachedUser) {
        setAuthUser(cachedUser)
      }
    } finally {
      setIsLoadingProfile(false)
    }
  }, [])

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open)
    if (open) {
      void refreshProfile()
    }
  }

  const openProfileSheet = () => {
    const user = authUser ?? getAuthUser()
    if (!user) return

    setName(user.name)
    setEmail(user.email ?? "")
    setMobileNo(user.mobile_no ?? "")
    setImage(user.image ?? "")
    setFormError(null)
    setSuccessMessage(null)
    setMenuOpen(false)
    setProfileOpen(true)
  }

  const openPasswordSheet = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setFormError(null)
    setSuccessMessage(null)
    setMenuOpen(false)
    setPasswordOpen(true)
  }

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

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
    setSuccessMessage(null)

    try {
      const updatedUser = await updateProfile({
        name: trimmedName,
        email: email.trim() || null,
        mobile_no: mobileNo.trim() || null,
        image: image.trim() || null,
      })
      setAuthUser(updatedUser)
      setSuccessMessage("Profile updated successfully")
      setTimeout(() => setProfileOpen(false), 800)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to update profile"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!currentPassword.trim() || !newPassword.trim()) {
      setFormError("All password fields are required")
      return
    }

    if (newPassword.length < 6) {
      setFormError("New password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match")
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)

    try {
      await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      })
      setSuccessMessage("Password changed successfully")
      setTimeout(() => setPasswordOpen(false), 800)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to change password"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayUser = authUser ?? getAuthUser()

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger
          type="button"
          className={cn(
            "inline-flex h-auto items-center gap-2 rounded-full border-0 bg-transparent px-1 py-1 outline-none",
            "hover:bg-[#f8f9fa] focus-visible:ring-2 focus-visible:ring-[#4DC591]/30"
          )}
          aria-label="User menu"
        >
          <Avatar className="size-9 after:border-0">
            <AvatarFallback className="bg-[#4DC591] text-xs font-semibold text-white">
              {displayUser ? getUserInitials(displayUser.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-[#373B44] sm:inline">
            {isLoadingProfile && menuOpen
              ? "Loading..."
              : (displayUser?.name ?? "User")}
          </span>
          <ChevronDown className="hidden size-4 text-[#8b95a5] sm:inline" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom" className="w-64">
          <DropdownMenuLabel className="px-2 py-2">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[#373B44]">
                {displayUser?.name ?? "User"}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {displayUser?.email ??
                  displayUser?.mobile_no ??
                  "No contact info"}
              </span>
              {displayUser?.role && (
                <span className="mt-1 inline-flex w-fit rounded-full bg-[#e8f8f0] px-2 py-0.5 text-[10px] font-medium text-[#2d6b52]">
                  {formatRole(displayUser.role)}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={event => {
                event.preventDefault()
                openProfileSheet()
              }}
            >
              <UserRound />
              Update Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={event => {
                event.preventDefault()
                openPasswordSheet()
              }}
            >
              <KeyRound />
              Change Password
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={event => {
                event.preventDefault()
                logout()
              }}
            >
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Update Profile</SheetTitle>
            <SheetDescription>
              Update your account information. Role cannot be changed here.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleProfileSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label htmlFor="profile-name" className="text-sm font-medium text-[#373B44]">
                Name
              </label>
              <Input
                id="profile-name"
                value={name}
                onChange={event => setName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-email" className="text-sm font-medium text-[#373B44]">
                Email
              </label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-mobile" className="text-sm font-medium text-[#373B44]">
                Mobile Number
              </label>
              <Input
                id="profile-mobile"
                value={mobileNo}
                onChange={event => setMobileNo(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-image" className="text-sm font-medium text-[#373B44]">
                Image URL
              </label>
              <Input
                id="profile-image"
                value={image}
                onChange={event => setImage(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            {successMessage && (
              <p className="text-sm text-[#2d6b52]">{successMessage}</p>
            )}

            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Save Profile
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={passwordOpen} onOpenChange={setPasswordOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Change Password</SheetTitle>
            <SheetDescription>
              Enter your current password and choose a new one.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handlePasswordSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label
                htmlFor="current-password"
                className="text-sm font-medium text-[#373B44]"
              >
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={event => setCurrentPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="text-sm font-medium text-[#373B44]"
              >
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-[#373B44]"
              >
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            {successMessage && (
              <p className="text-sm text-[#2d6b52]">{successMessage}</p>
            )}

            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Update Password
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
