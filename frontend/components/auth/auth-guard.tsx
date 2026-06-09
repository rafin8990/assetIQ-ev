"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { getAccessToken, getAuthUser, syncAuthCookie } from "@/lib/auth/token"
import { getProfile } from "@/services/auth"

type AuthGuardProps = {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    const token = getAccessToken()

    if (!token) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : ""
      router.replace(`/login${redirect}`)
      return
    }

    syncAuthCookie()

    const user = getAuthUser()
    const needsPermissionsRefresh = !user?.permissions?.length && user?.role !== "super_admin"

    if (needsPermissionsRefresh) {
      getProfile()
        .catch(() => undefined)
        .finally(() => setIsReady(true))
      return
    }

    setIsReady(true)
  }, [pathname, router])

  if (!isReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f8f9fb]">
        <div className="flex flex-col items-center gap-3 text-[#8b95a5]">
          <Loader2 className="size-8 animate-spin text-[#4DC591]" />
          <p className="text-sm">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
