"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { selectClassName } from "@/components/stocks/stock-constants"
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
import { ApiError } from "@/lib/api/client"
import { addManualStock, updateStock } from "@/services/stocks"
import type { Item } from "@/types/items"
import type { Stock } from "@/types/stocks"
import type { Unit } from "@/types/units"

type FormMode = "create" | "edit"

type StockFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FormMode
  stock?: Stock | null
  items: Item[]
  units: Unit[]
  onSuccess: () => void
}

export function StockFormModal({
  open,
  onOpenChange,
  mode,
  stock,
  items,
  units,
  onSuccess,
}: StockFormModalProps) {
  const [itemId, setItemId] = React.useState("")
  const [quantity, setQuantity] = React.useState("")
  const [unitId, setUnitId] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    if (mode === "edit" && stock) {
      setItemId(String(stock.item_id))
      setQuantity(String(stock.quantity))
      setUnitId(stock.unit_id ? String(stock.unit_id) : "")
    } else {
      setItemId("")
      setQuantity("")
      setUnitId("")
    }

    setFormError(null)
  }, [open, mode, stock])

  const handleItemChange = (value: string) => {
    setItemId(value)
    const selectedItem = items.find(item => item.id === Number(value))
    if (selectedItem?.unit_id) {
      setUnitId(String(selectedItem.unit_id))
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const parsedQuantity = Number(quantity)

    if (!quantity) {
      setFormError("Quantity is required")
      return
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      setFormError("Enter a valid quantity (zero or greater)")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      if (mode === "edit" && stock) {
        await updateStock(stock.id, {
          quantity: parsedQuantity,
          unit_id: unitId ? Number(unitId) : null,
        })
      } else {
        const parsedItemId = Number(itemId)

        if (!itemId) {
          setFormError("Item is required")
          setIsSubmitting(false)
          return
        }

        if (Number.isNaN(parsedItemId) || parsedQuantity <= 0) {
          setFormError("Enter a valid quantity greater than zero")
          setIsSubmitting(false)
          return
        }

        await addManualStock({
          item_id: parsedItemId,
          quantity: parsedQuantity,
          unit_id: unitId ? Number(unitId) : null,
        })
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : mode === "edit"
              ? "Failed to update stock"
              : "Failed to add stock"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const itemLabel =
    mode === "edit" && stock
      ? (stock.item_name ?? `Item #${stock.item_id}`)
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add Stock Manually" : "Edit Stock"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Increase inventory for an item. If stock already exists, quantity will be added to the current amount."
                : "Update the stock quantity and unit for this item."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="stock-item"
                className="text-sm font-medium text-[#373B44]"
              >
                Item {mode === "create" && <span className="text-red-500">*</span>}
              </label>
              {mode === "edit" ? (
                <div className="flex h-9 items-center rounded-md border border-[#e8eaed] bg-[#f8f9fb] px-3 text-sm text-[#373B44]">
                  {itemLabel}
                </div>
              ) : (
                <select
                  id="stock-item"
                  value={itemId}
                  onChange={e => handleItemChange(e.target.value)}
                  className={selectClassName}
                  disabled={isSubmitting}
                >
                  <option value="">Select item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="stock-quantity"
                className="text-sm font-medium text-[#373B44]"
              >
                {mode === "create" ? "Quantity to Add" : "Quantity"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="stock-quantity"
                type="number"
                min={mode === "create" ? "0.01" : "0"}
                step="any"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                className={selectClassName}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="stock-unit"
                className="text-sm font-medium text-[#373B44]"
              >
                Unit
              </label>
              <select
                id="stock-unit"
                value={unitId}
                onChange={e => setUnitId(e.target.value)}
                className={selectClassName}
                disabled={isSubmitting}
              >
                <option value="">Select unit (optional)</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
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
              {mode === "create" ? "Add Stock" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
