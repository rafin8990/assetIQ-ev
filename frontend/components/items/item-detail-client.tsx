"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Boxes,
  Building2,
  Layers,
  Loader2,
  Package,
  Pencil,
  Ruler,
  Tag,
} from "lucide-react"

import { ItemFormModal } from "@/components/items/item-form-modal"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { getAssetUrl, ApiError } from "@/lib/api/client"
import { getBrands } from "@/services/brands"
import { getCategories } from "@/services/categories"
import { getItem } from "@/services/items"
import { getSubCategories } from "@/services/sub-categories"
import { getUnits } from "@/services/units"
import type { Brand } from "@/types/brands"
import type { Category } from "@/types/categories"
import type { Item } from "@/types/items"
import type { SubCategory } from "@/types/sub-categories"
import type { Unit } from "@/types/units"

type ItemDetailClientProps = {
  itemId: number
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[#e8eaed] bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-[#8b95a5] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#373B44]">{value}</p>
    </div>
  )
}

export function ItemDetailClient({ itemId }: ItemDetailClientProps) {
  const [item, setItem] = React.useState<Item | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [subCategories, setSubCategories] = React.useState<SubCategory[]>([])
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [activeImage, setActiveImage] = React.useState(0)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [itemData, categoriesRes, subCategoriesRes, brandsRes, unitsRes] =
        await Promise.all([
          getItem(itemId),
          getCategories({ limit: 100, sortBy: "name", sortOrder: "asc" }),
          getSubCategories({ limit: 100, sortBy: "name", sortOrder: "asc" }),
          getBrands({ limit: 100, sortBy: "name", sortOrder: "asc" }),
          getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
        ])

      setItem(itemData)
      setCategories(categoriesRes.data)
      setSubCategories(subCategoriesRes.data)
      setBrands(brandsRes.data)
      setUnits(unitsRes.data)
      setActiveImage(0)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load item"
      setError(message)
      setItem(null)
    } finally {
      setIsLoading(false)
    }
  }, [itemId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-[#8b95a5]">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          Loading item details...
        </span>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link
          href="/assets/items"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <ArrowLeft />
          Back to Items
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-600">
          {error ?? "Item not found"}
        </div>
      </div>
    )
  }

  const images = item.images ?? []
  const heroImage = images[activeImage]?.image
    ? getAssetUrl(images[activeImage].image)
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/assets/items"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <ArrowLeft />
          Back to Items
        </Link>
        <Button onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit Item
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-6 py-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-white/70">
                <Package className="size-4" />
                <span className="text-sm">Item #{item.id}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.brand_name && (
                  <Badge className="bg-white/10 text-white hover:bg-white/15">
                    <Tag className="size-3.5" />
                    {item.brand_name}
                  </Badge>
                )}
                {item.category_name && (
                  <Badge className="bg-white/10 text-white hover:bg-white/15">
                    <Layers className="size-3.5" />
                    {item.category_name}
                  </Badge>
                )}
                {item.type && (
                  <Badge className="bg-[#4DC591]/20 text-[#d8ffef] hover:bg-[#4DC591]/25">
                    {item.type}
                  </Badge>
                )}
              </div>
            </div>
            {item.low_stock_amount && (
              <Card className="border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <p className="text-xs font-medium uppercase tracking-wide">
                  Low Stock Threshold
                </p>
                <p className="text-2xl font-bold">{item.low_stock_amount}</p>
              </Card>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-[#f8f9fb]">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={item.name}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-[#8b95a5]">
                  <Package className="size-16 opacity-40" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((image, index) => {
                  const src = getAssetUrl(image.image)
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`overflow-hidden rounded-lg border ${
                        activeImage === index
                          ? "border-[#4DC591] ring-2 ring-[#4DC591]/30"
                          : "border-[#e8eaed]"
                      }`}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={`${item.name} ${index + 1}`}
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-[#f8f9fb] text-xs text-[#8b95a5]">
                          N/A
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-[#e8eaed] p-5">
              <h2 className="mb-4 text-lg font-semibold text-[#373B44]">
                Overview
              </h2>
              {item.description ? (
                <p className="text-sm leading-6 text-[#5c6370]">
                  {item.description}
                </p>
              ) : (
                <p className="text-sm text-[#8b95a5]">No description provided.</p>
              )}
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Category" value={item.category_name ?? "—"} />
              <DetailField
                label="Sub Category"
                value={item.sub_category_name ?? "—"}
              />
              <DetailField label="Brand" value={item.brand_name ?? "—"} />
              <DetailField label="Unit" value={item.unit_name ?? "—"} />
              <DetailField label="Model" value={item.model ?? "—"} />
              <DetailField label="Type" value={item.type ?? "—"} />
              <DetailField label="Material" value={item.material ?? "—"} />
              <DetailField
                label="Low Stock Amount"
                value={item.low_stock_amount ?? "—"}
              />
            </div>

            <Card className="border-[#e8eaed] p-5">
              <h2 className="mb-4 text-lg font-semibold text-[#373B44]">
                Metadata
              </h2>
              <div className="space-y-3 text-sm text-[#5c6370]">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-[#4DC591]" />
                  <span>Created: {formatDate(item.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="size-4 text-[#4DC591]" />
                  <span>Updated: {formatDate(item.updated_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Boxes className="size-4 text-[#4DC591]" />
                  <span>{images.length} photo{images.length === 1 ? "" : "s"}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ItemFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        item={item}
        categories={categories}
        subCategories={subCategories}
        brands={brands}
        units={units}
        onSuccess={fetchData}
      />
    </div>
  )
}
