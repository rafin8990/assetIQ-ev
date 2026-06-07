"use client"

import * as React from "react"
import { ImagePlus, Loader2, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getAssetUrl } from "@/lib/api/client"
import { ApiError } from "@/lib/api/client"
import {
  addItemImages,
  createItem,
  deleteItemImage,
  updateItem,
} from "@/services/items"
import type { Brand } from "@/types/brands"
import type { Category } from "@/types/categories"
import type { Item } from "@/types/items"
import type { SubCategory } from "@/types/sub-categories"
import type { Unit } from "@/types/units"

type FormMode = "create" | "edit"

type ItemFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FormMode
  item?: Item | null
  categories: Category[]
  subCategories: SubCategory[]
  brands: Brand[]
  units: Unit[]
  onSuccess: () => void
}

const selectClassName =
  "flex h-9 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-1 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

const textareaClassName =
  "flex min-h-24 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-2 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

function parseOptionalId(value: string) {
  return value ? Number(value) : null
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

export function ItemFormModal({
  open,
  onOpenChange,
  mode,
  item,
  categories,
  subCategories,
  brands,
  units,
  onSuccess,
}: ItemFormModalProps) {
  const [name, setName] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [subCategoryId, setSubCategoryId] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [brandId, setBrandId] = React.useState("")
  const [model, setModel] = React.useState("")
  const [type, setType] = React.useState("")
  const [material, setMaterial] = React.useState("")
  const [unitId, setUnitId] = React.useState("")
  const [lowStockAmount, setLowStockAmount] = React.useState("")
  const [imageFiles, setImageFiles] = React.useState<File[]>([])
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([])
  const [existingImages, setExistingImages] = React.useState(item?.images ?? [])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const filteredSubCategories = React.useMemo(() => {
    if (!categoryId) return subCategories
    return subCategories.filter(
      sub => sub.category_id === Number(categoryId)
    )
  }, [categoryId, subCategories])

  React.useEffect(() => {
    if (!open) return

    if (mode === "edit" && item) {
      setName(item.name)
      setCategoryId(item.category_id ? String(item.category_id) : "")
      setSubCategoryId(item.sub_category_id ? String(item.sub_category_id) : "")
      setDescription(item.description ?? "")
      setBrandId(item.brand_id ? String(item.brand_id) : "")
      setModel(item.model ?? "")
      setType(item.type ?? "")
      setMaterial(item.material ?? "")
      setUnitId(item.unit_id ? String(item.unit_id) : "")
      setLowStockAmount(
        item.low_stock_amount !== null ? String(item.low_stock_amount) : ""
      )
      setExistingImages(item.images ?? [])
    } else {
      setName("")
      setCategoryId("")
      setSubCategoryId("")
      setDescription("")
      setBrandId("")
      setModel("")
      setType("")
      setMaterial("")
      setUnitId("")
      setLowStockAmount("")
      setExistingImages([])
    }

    setImageFiles([])
    setImagePreviews([])
    setFormError(null)
  }, [open, mode, item])

  React.useEffect(() => {
    const urls = imageFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [imageFiles])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setImageFiles(prev => [...prev, ...files])
    event.target.value = ""
  }

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!item) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      const updated = await deleteItemImage(item.id, imageId)
      setExistingImages(updated.images ?? [])
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete image"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setFormError("Name is required")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const payload = {
      name: trimmedName,
      category_id: parseOptionalId(categoryId),
      sub_category_id: parseOptionalId(subCategoryId),
      description: description.trim() || null,
      brand_id: parseOptionalId(brandId),
      model: model.trim() || null,
      type: type.trim() || null,
      material: material.trim() || null,
      unit_id: parseOptionalId(unitId),
      low_stock_amount: parseOptionalNumber(lowStockAmount),
    }

    try {
      if (mode === "create") {
        await createItem(payload, imageFiles)
      } else if (item) {
        await updateItem(item.id, payload)
        if (imageFiles.length) {
          await addItemImages(item.id, imageFiles)
        }
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save item"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add Item" : "Edit Item"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create a new inventory item with optional photos."
                : "Update item details and manage photos."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="item-name" className="text-sm font-medium text-[#373B44]">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="item-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Industrial Motor"
                  maxLength={255}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="item-category" className="text-sm font-medium text-[#373B44]">
                  Category
                </label>
                <select
                  id="item-category"
                  value={categoryId}
                  onChange={e => {
                    setCategoryId(e.target.value)
                    setSubCategoryId("")
                  }}
                  className={selectClassName}
                  disabled={isSubmitting}
                >
                  <option value="">None</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="item-sub-category" className="text-sm font-medium text-[#373B44]">
                  Sub Category
                </label>
                <select
                  id="item-sub-category"
                  value={subCategoryId}
                  onChange={e => setSubCategoryId(e.target.value)}
                  className={selectClassName}
                  disabled={isSubmitting}
                >
                  <option value="">None</option>
                  {filteredSubCategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="item-brand" className="text-sm font-medium text-[#373B44]">
                  Brand
                </label>
                <select
                  id="item-brand"
                  value={brandId}
                  onChange={e => setBrandId(e.target.value)}
                  className={selectClassName}
                  disabled={isSubmitting}
                >
                  <option value="">None</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="item-unit" className="text-sm font-medium text-[#373B44]">
                  Unit
                </label>
                <select
                  id="item-unit"
                  value={unitId}
                  onChange={e => setUnitId(e.target.value)}
                  className={selectClassName}
                  disabled={isSubmitting}
                >
                  <option value="">None</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="item-model" className="text-sm font-medium text-[#373B44]">
                  Model
                </label>
                <Input
                  id="item-model"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="Optional"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="item-type" className="text-sm font-medium text-[#373B44]">
                  Type
                </label>
                <Input
                  id="item-type"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  placeholder="Optional"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="item-material" className="text-sm font-medium text-[#373B44]">
                  Material
                </label>
                <Input
                  id="item-material"
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                  placeholder="Optional"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="item-low-stock" className="text-sm font-medium text-[#373B44]">
                  Low Stock Amount
                </label>
                <Input
                  id="item-low-stock"
                  type="number"
                  min="0"
                  step="any"
                  value={lowStockAmount}
                  onChange={e => setLowStockAmount(e.target.value)}
                  placeholder="Optional"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="item-description" className="text-sm font-medium text-[#373B44]">
                  Description
                </label>
                <textarea
                  id="item-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional item description"
                  className={textareaClassName}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-dashed border-[#d5dae1] bg-[#f8f9fb] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#373B44]">Photos</p>
                  <p className="text-xs text-[#8b95a5]">
                    Upload JPG, PNG, WEBP or GIF (max 5MB each)
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#373B44] px-3 py-2 text-sm font-medium text-white hover:bg-[#4a4f5c]">
                  <ImagePlus className="size-4" />
                  Add Photos
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              {(existingImages.length > 0 || imagePreviews.length > 0) && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {existingImages.map(image => {
                    const src = getAssetUrl(image.image)
                    return (
                      <div
                        key={image.id}
                        className="group relative overflow-hidden rounded-lg border border-[#e8eaed] bg-white"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt="Item"
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square items-center justify-center text-xs text-[#8b95a5]">
                            No preview
                          </div>
                        )}
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(image.id)}
                            className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {imagePreviews.map((preview, index) => (
                    <div
                      key={preview}
                      className="group relative overflow-hidden rounded-lg border border-[#e8eaed] bg-white"
                    >
                      <img
                        src={preview}
                        alt="New upload"
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 rounded-full bg-[#373B44] p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        disabled={isSubmitting}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {mode === "create" ? "Create Item" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
