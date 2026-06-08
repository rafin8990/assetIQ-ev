"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import {
  APP_VERSION,
  sidebarNavSections,
  type NavLinkItem,
  type NavSubItem,
} from "@/config/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type DashboardSidebarProps = {
  collapsed?: boolean
  onNavigate?: () => void
}

function NavLink({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: NavLinkItem
  isActive: boolean
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  if (!item.href) return null

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
      className={cn(
        "group relative flex items-center gap-3 py-2.5 text-sm transition-colors",
        collapsed ? "justify-center px-2" : "px-5",
        isActive
          ? "border-l-4 border-[#373B44] bg-[#f4f5f7] font-semibold text-[#373B44]"
          : "border-l-4 border-transparent font-normal text-[#5c6370] hover:bg-[#f8f9fa] hover:text-[#373B44]"
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          isActive ? "text-[#373B44]" : "text-[#8b95a5]"
        )}
        strokeWidth={isActive ? 2.25 : 1.75}
      />
      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
    </Link>
  )
}

function isNavSubItemActive(item: NavSubItem, pathname: string): boolean {
  if (item.href) {
    return pathname.startsWith(item.href)
  }

  return item.children?.some((child) => isNavSubItemActive(child, pathname)) ?? false
}

function NavSubLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavSubItem
  isActive: boolean
  onNavigate?: () => void
}) {
  if (!item.href) return null

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "block py-2 pl-3 text-sm transition-colors",
        isActive
          ? "font-semibold text-[#373B44]"
          : "font-normal text-[#5c6370] hover:text-[#373B44]"
      )}
    >
      {item.title}
    </Link>
  )
}

function NavSubGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavSubItem
  pathname: string
  onNavigate?: () => void
}) {
  const children = item.children ?? []
  const hasActiveChild = isNavSubItemActive(item, pathname)
  const [open, setOpen] = React.useState(hasActiveChild)

  React.useEffect(() => {
    if (hasActiveChild) {
      setOpen(true)
    }
  }, [hasActiveChild])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2 py-2 pl-3 text-left text-sm transition-colors",
          hasActiveChild
            ? "font-semibold text-[#373B44]"
            : "font-normal text-[#5c6370] hover:text-[#373B44]"
        )}
      >
        <span className="flex-1 truncate">{item.title}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-[#8b95a5] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="ml-3 border-l border-[#e8eaed] py-1 pl-3">
          {children.map((child) =>
            child.children?.length ? (
              <NavSubGroup
                key={child.title}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ) : (
              <NavSubLink
                key={child.href ?? child.title}
                item={child}
                isActive={child.href ? pathname.startsWith(child.href) : false}
                onNavigate={onNavigate}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

function renderCollapsedSubItems(
  items: NavSubItem[],
  onNavigate?: () => void
): React.ReactNode {
  return items.map((child) => {
    if (child.children?.length) {
      return (
        <React.Fragment key={child.title}>
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-[#8b95a5]">
            {child.title}
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {renderCollapsedSubItems(child.children, onNavigate)}
          </DropdownMenuGroup>
        </React.Fragment>
      )
    }

    if (!child.href) return null

    return (
      <DropdownMenuItem
        key={child.href}
        render={<Link href={child.href} onClick={onNavigate} />}
      >
        {child.title}
      </DropdownMenuItem>
    )
  })
}

function NavGroup({
  item,
  collapsed,
  pathname,
  onNavigate,
}: {
  item: NavLinkItem
  collapsed?: boolean
  pathname: string
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const children = item.children ?? []
  const hasActiveChild = children.some((child) =>
    isNavSubItemActive(child, pathname)
  )
  const [open, setOpen] = React.useState(hasActiveChild)

  React.useEffect(() => {
    if (hasActiveChild) {
      setOpen(true)
    }
  }, [hasActiveChild])

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              title={item.title}
              className={cn(
                "group relative flex w-full items-center justify-center px-2 py-2.5 text-sm transition-colors",
                hasActiveChild
                  ? "border-l-4 border-[#373B44] bg-[#f4f5f7] font-semibold text-[#373B44]"
                  : "border-l-4 border-transparent font-normal text-[#5c6370] hover:bg-[#f8f9fa] hover:text-[#373B44]"
              )}
            />
          }
        >
          <Icon
            className={cn(
              "size-[18px] shrink-0",
              hasActiveChild ? "text-[#373B44]" : "text-[#8b95a5]"
            )}
            strokeWidth={hasActiveChild ? 2.25 : 1.75}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="min-w-40">
          <DropdownMenuLabel className="text-xs font-medium text-[#8b95a5]">
            {item.title}
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {renderCollapsedSubItems(children, onNavigate)}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group relative flex w-full items-center gap-3 py-2.5 text-sm transition-colors",
          "px-5",
          hasActiveChild
            ? "border-l-4 border-[#373B44] bg-[#f4f5f7] font-semibold text-[#373B44]"
            : "border-l-4 border-transparent font-normal text-[#5c6370] hover:bg-[#f8f9fa] hover:text-[#373B44]"
        )}
      >
        <Icon
          className={cn(
            "size-[18px] shrink-0",
            hasActiveChild ? "text-[#373B44]" : "text-[#8b95a5]"
          )}
          strokeWidth={hasActiveChild ? 2.25 : 1.75}
        />
        <span className="flex-1 truncate text-left">{item.title}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#8b95a5] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="ml-8 border-l border-[#e8eaed] py-1 pl-4">
          {children.map((child) =>
            child.children?.length ? (
              <NavSubGroup
                key={child.title}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ) : (
              <NavSubLink
                key={child.href ?? child.title}
                item={child}
                isActive={child.href ? pathname.startsWith(child.href) : false}
                onNavigate={onNavigate}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

export function DashboardSidebar({
  collapsed = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className={cn(
          "shrink-0 border-b border-[#e8eaed] pt-5 pb-4",
          collapsed ? "px-3" : "px-5"
        )}
      >
        <div className={cn("flex flex-col", collapsed ? "items-center" : "")}>
          <Image
            src="/asset-iq-logo.svg"
            alt="Asset IQ"
            width={collapsed ? 28 : 130}
            height={collapsed ? 28 : 26}
            priority
            className={cn(
              "h-auto w-auto",
              collapsed ? "max-w-[28px]" : "max-w-[130px]"
            )}
          />
          {!collapsed && (
            <p className="mt-1.5 text-[10px] font-medium tracking-wide text-[#8b95a5] uppercase">
              Asset Management System
            </p>
          )}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="py-2">
          {sidebarNavSections.map((section, sectionIndex) => (
            <div key={section.label ?? sectionIndex}>
              {section.label && !collapsed && (
                <p className="px-5 pt-4 pb-1 text-xs font-medium text-[#8b95a5]">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && (
                <div className="mx-3 my-3 border-t border-[#e8eaed]" />
              )}
              <div className="flex flex-col">
                {section.items.map((item) =>
                  item.children?.length ? (
                    <NavGroup
                      key={item.title}
                      item={item}
                      collapsed={collapsed}
                      pathname={pathname}
                      onNavigate={onNavigate}
                    />
                  ) : (
                    <NavLink
                      key={item.href}
                      item={item}
                      isActive={isActive(item.href ?? "")}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {!collapsed && (
        <div className="mt-auto shrink-0 border-t border-[#e8eaed]">
          <div className="px-4 pt-3">
            <Image
              src="/footerimg.png"
              alt="Team illustration"
              width={452}
              height={252}
              className="mx-auto h-auto w-full object-contain"
            />
          </div>
          <p className="pb-4 text-center text-xs font-medium text-[#4DC591]">
            v {APP_VERSION}
          </p>
        </div>
      )}
    </div>
  )
}
