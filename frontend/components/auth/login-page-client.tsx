"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Package,
  Shield,
  Smartphone,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { getAccessToken, syncAuthCookie } from "@/lib/auth/token"
import { login } from "@/services/auth"

const features = [
  {
    icon: Package,
    title: "Asset Catalog",
    description: "Manage items, categories, brands, and units in one place.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure admin, super admin, and user permissions.",
  },
  {
    icon: Sparkles,
    title: "Live Dashboard",
    description: "Real-time overview of inventory and procurement activity.",
  },
]

export function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  const [identifier, setIdentifier] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (getAccessToken()) {
      syncAuthCookie()
      router.replace(redirectTo)
    }
  }, [redirectTo, router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!identifier.trim() || !password.trim()) {
      setError("Email/mobile and password are required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await login({
        identifier: identifier.trim(),
        password: password.trim(),
      })
      router.replace(redirectTo)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Login failed"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh bg-[#f8f9fb]">
      <div className="relative hidden w-[48%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4DC591] via-[#2f7a5c] to-[#373B44]" />
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-[#4DC591]/25" />
        <div className="absolute -bottom-16 -right-16 size-64 rounded-full bg-[#373B44]/40" />
        <div className="absolute top-1/3 right-1/4 size-48 rounded-full bg-white/[0.06]" />

        <div className="relative z-10 flex flex-col gap-8 p-10 xl:p-14">
          <div>
            <Image
              src="/asset-iq-logo.svg"
              alt="Asset IQ"
              width={150}
              height={30}
              className="h-auto w-auto max-w-[150px] brightness-0 invert"
              priority
            />
            <p className="mt-2 text-sm font-medium tracking-wide text-white/60 uppercase">
              Asset Management System
            </p>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Manage your assets with confidence
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              Sign in to access your dashboard, inventory tools, procurement
              workflows, and user management.
            </p>
          </div>

          <div className="space-y-5">
            {features.map(feature => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <Icon className="size-5 text-[#d8ffef]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="mt-1 text-sm text-white/65">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 px-10 py-6 xl:px-14">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Asset IQ. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center lg:hidden">
            <Image
              src="/asset-iq-logo.svg"
              alt="Asset IQ"
              width={130}
              height={26}
              className="mx-auto h-auto w-auto max-w-[130px]"
              priority
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-xl shadow-[#373B44]/5">
            <div className="border-b border-[#e8eaed] px-6 py-6 sm:px-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e8f8f0] px-3 py-1 text-xs font-medium text-[#2d6b52]">
                <Sparkles className="size-3.5" />
                Secure Login
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-[#8b95a5]">
                Use your email address or mobile number to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8">
              <div className="space-y-2">
                <label
                  htmlFor="identifier"
                  className="text-sm font-medium text-[#373B44]"
                >
                  Email or Mobile Number
                </label>
                <div className="relative">
                  {identifier.includes("@") ? (
                    <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                  ) : (
                    <Smartphone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                  )}
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={event => setIdentifier(event.target.value)}
                    placeholder="admin@example.com or +88017..."
                    className="h-11 border-[#e8eaed] pl-10 focus-visible:border-[#4DC591] focus-visible:ring-[#4DC591]/20"
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#373B44]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-11 border-[#e8eaed] pr-10 pl-10 focus-visible:border-[#4DC591] focus-visible:ring-[#4DC591]/20"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8b95a5] transition-colors hover:text-[#373B44]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full bg-[#4DC591] text-white hover:bg-[#3db382]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <LogIn data-icon="inline-start" />
                )}
                Sign In
              </Button>
            </form>

            <div className="border-t border-[#e8eaed] bg-[#f8f9fb] px-6 py-4 sm:px-8">
              <p className="text-center text-xs text-[#8b95a5]">
                Demo:{" "}
                <span className="font-medium text-[#5c6370]">
                  superadmin@example.com
                </span>{" "}
                /{" "}
                <span className="font-medium text-[#5c6370]">superadmin123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
