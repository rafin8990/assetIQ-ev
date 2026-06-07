import type { Metadata } from "next"
import { Suspense } from "react"

import { LoginPageClient } from "@/components/auth/login-page-client"

export const metadata: Metadata = { title: "Login" }

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#f8f9fb] text-sm text-[#8b95a5]">
          Loading...
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  )
}
