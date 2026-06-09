"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Home,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Warehouse,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const quickLinks = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview & stats",
  },
  {
    title: "Items",
    href: "/assets/items",
    icon: Package,
    description: "Asset catalog",
  },
  {
    title: "Requisitions",
    href: "/requisitions",
    icon: ShoppingCart,
    description: "Procurement",
  },
  {
    title: "Stock",
    href: "/stock",
    icon: Warehouse,
    description: "Inventory levels",
  },
  {
    title: "Out Request",
    href: "/outbound/out-request",
    icon: Truck,
    description: "Outbound ops",
  },
]

export function NotFoundPage() {
  const router = useRouter()

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#f8f9fb] lg:flex-row">
      <div className="relative hidden w-[44%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4DC591] via-[#2f7a5c] to-[#373B44]" />
        <div className="absolute -top-20 -left-20 size-80 rounded-full bg-[#4DC591]/25 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-96 rounded-full bg-[#373B44]/35 blur-3xl" />
        <div className="absolute top-1/4 right-1/3 size-56 rounded-full bg-white/[0.07]" />

        <div className="relative z-10 flex flex-1 flex-col justify-center p-10 xl:p-14">
          <Image
            src="/asset-iq-logo.svg"
            alt="Asset IQ"
            width={150}
            height={30}
            className="mb-10 h-auto w-auto max-w-[150px] brightness-0 invert"
            priority
          />

          <p
            className="text-[clamp(7rem,18vw,11rem)] font-black leading-none tracking-tighter text-white/15"
            aria-hidden
          >
            404
          </p>
          <h1 className="-mt-6 max-w-md text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            This page took a wrong turn
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">
            The route you requested doesn&apos;t exist or may have been moved.
            Head back to the dashboard to continue managing your assets.
          </p>
        </div>

        <div className="relative z-10 border-t border-white/10 px-10 py-6 xl:px-14">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Asset IQ. All rights reserved.
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-0 size-64 rounded-full bg-[#4DC591]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-72 rounded-full bg-[#373B44]/5 blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg">
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
            <div className="relative border-b border-[#e8eaed] bg-gradient-to-r from-[#e8f8f0]/80 to-white px-6 py-8 sm:px-8">
              <div className="absolute -top-8 -right-4 text-8xl font-black text-[#4DC591]/10 lg:hidden">
                404
              </div>
              <div className="relative">
                <span className="inline-flex items-center rounded-full bg-[#e8f8f0] px-3 py-1 text-xs font-semibold text-[#2d6b52]">
                  Error 404
                </span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#373B44] sm:text-3xl">
                  Page not found
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#8b95a5] sm:text-base">
                  We couldn&apos;t find the page you&apos;re looking for. Check
                  the URL or use one of the options below.
                </p>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "h-11 flex-1 bg-[#4DC591] text-white hover:bg-[#3db382]"
                  )}
                >
                  <Home data-icon="inline-start" />
                  Go to Dashboard
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 border-[#e8eaed]"
                  onClick={() => router.back()}
                >
                  <ArrowLeft data-icon="inline-start" />
                  Go Back
                </Button>
              </div>

              <div className="pt-2">
                <p className="mb-3 text-xs font-semibold tracking-wide text-[#8b95a5] uppercase">
                  Popular destinations
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quickLinks.map(link => {
                    const Icon = link.icon

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl border border-[#e8eaed] bg-[#f8f9fb] px-3.5 py-3 transition-all",
                          "hover:border-[#4DC591]/40 hover:bg-[#e8f8f0]/60 hover:shadow-sm"
                        )}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#4DC591] text-white shadow-sm transition-transform group-hover:scale-105">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#373B44]">
                            {link.title}
                          </p>
                          <p className="truncate text-xs text-[#8b95a5]">
                            {link.description}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-[#e8eaed] bg-[#f8f9fb] px-6 py-4 text-center sm:px-8">
              <p className="text-xs text-[#8b95a5]">
                Need help?{" "}
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "link", size: "sm" }),
                    "h-auto p-0 text-[#2d6b52]"
                  )}
                >
                  Return to the home dashboard
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
