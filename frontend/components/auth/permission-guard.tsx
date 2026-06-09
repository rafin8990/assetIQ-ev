"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Loader2, Shield } from "lucide-react"

import { canAccessRoute } from "@/lib/auth/permissions"
import { getAuthUser } from "@/lib/auth/token"

type PermissionGuardProps = {
  children: React.ReactNode
}

export function PermissionGuard({ children }: PermissionGuardProps) {
  const pathname = usePathname()
  const [isReady, setIsReady] = React.useState(false)
  const [hasAccess, setHasAccess] = React.useState(true)

  React.useEffect(() => {
    const user = getAuthUser()
    setHasAccess(canAccessRoute(user, pathname))
    setIsReady(true)
  }, [pathname])

  if (!isReady) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#4DC591]" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-[#e8eaed] bg-white p-8 text-center">
        <Shield className="mb-3 size-10 text-[#8b95a5]" />
        <h2 className="text-lg font-semibold text-[#373B44]">Access restricted</h2>
        <p className="mt-2 max-w-md text-sm text-[#8b95a5]">
          You do not have permission to access this page. Contact an administrator
          if you need access.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
