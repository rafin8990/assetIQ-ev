"use client"

import * as React from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

import {
  selectClassName,
  textareaClassName,
} from "@/components/out-requests/out-request-constants"
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
import { getAuthUser } from "@/lib/auth/token"
import { createOutRequest, updateOutRequest } from "@/services/out-requests"
import type { Item } from "@/types/items"
import type { OutRequest, OutRequestItemPayload } from "@/types/out-requests"
import type { Unit } from "@/types/units"

type FormMode = "create" | "edit"

type LineItemRow = {
  key: string
  item_id: string
  requested_quantity: string
  unit_id: string
}

type OutRequestFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FormMode
  outRequest?: OutRequest | null
  items: Item[]
  units: Unit[]
  onSuccess: () => void
  onCreated?: (outRequest: OutRequest) => void
}

function createEmptyRow(): LineItemRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    item_id: "",
    requested_quantity: "",
    unit_id: "",
  }
}

function rowsFromOutRequest(outRequest: OutRequest): LineItemRow[] {
  if (!outRequest.items.length) return [createEmptyRow()]

  return outRequest.items.map(item => ({
    key: `existing-${item.id}`,
    item_id: String(item.item_id),
    requested_quantity: String(item.requested_quantity),
    unit_id: item.unit_id ? String(item.unit_id) : "",
  }))
}

export function OutRequestFormModal({
  open,
  onOpenChange,
  mode,
  outRequest,
  items,
  units,
  onSuccess,
  onCreated,
}: OutRequestFormModalProps) {
  const [description, setDescription] = React.useState("")
  const [lineItems, setLineItems] = React.useState<LineItemRow[]>([
    createEmptyRow(),
  ])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    if (mode === "edit" && outRequest) {
      setDescription(outRequest.description ?? "")
      setLineItems(rowsFromOutRequest(outRequest))
    } else {
      setDescription("")
      setLineItems([createEmptyRow()])
    }

    setFormError(null)
  }, [open, mode, outRequest])

  const handleItemChange = (index: number, itemId: string) => {
    setLineItems(prev => {
      const next = [...prev]
      const selectedItem = items.find(item => item.id === Number(itemId))
      next[index] = {
        ...next[index],
        item_id: itemId,
        unit_id: selectedItem?.unit_id ? String(selectedItem.unit_id) : "",
      }
      return next
    })
  }

  const addLineItem = () => {
    setLineItems(prev => [...prev, createEmptyRow()])
  }

  const removeLineItem = (index: number) => {
    setLineItems(prev =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    )
  }

  const buildItemsPayload = (): OutRequestItemPayload[] | null => {
    const payload: OutRequestItemPayload[] = []

    for (const row of lineItems) {
      const itemId = Number(row.item_id)
      const quantity = Number(row.requested_quantity)
      const unitId = row.unit_id ? Number(row.unit_id) : null

      if (!row.item_id || !row.requested_quantity) {
        return null
      }

      if (Number.isNaN(itemId) || Number.isNaN(quantity) || quantity <= 0) {
        return null
      }

      payload.push({
        item_id: itemId,
        requested_quantity: quantity,
        unit_id: unitId,
      })
    }

    return payload
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const authUser = getAuthUser()
    if (!authUser) {
      setFormError("You must be logged in to submit an out request")
      return
    }

    const itemsPayload = buildItemsPayload()
    if (!itemsPayload?.length) {
      setFormError(
        "Add at least one line item with item and requested quantity"
      )
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      if (mode === "create") {
        const created = await createOutRequest({
          description: description.trim() || null,
          requested_by: authUser.id,
          items: itemsPayload,
        })

        onOpenChange(false)
        if (onCreated) {
          onCreated(created)
        } else {
          onSuccess()
        }
        return
      }

      if (outRequest) {
        await updateOutRequest(outRequest.id, {
          description: description.trim() || null,
          items: itemsPayload,
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
            : "Failed to save out request"
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
              {mode === "create" ? "New Out Request" : "Edit Out Request"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Request materials to be sent out from stock."
                : "Update out request details. Only pending requests can be edited."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="out-description"
                className="text-sm font-medium text-[#373B44]"
              >
                Description
              </label>
              <textarea
                id="out-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Purpose or notes for this out request"
                className={textareaClassName}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#373B44]">
                    Line Items <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-[#8b95a5]">
                    Select item, requested quantity, and unit
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  disabled={isSubmitting}
                >
                  <Plus />
                  Add Row
                </Button>
              </div>

              <div className="space-y-2">
                {lineItems.map((row, index) => (
                  <div
                    key={row.key}
                    className="grid gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-3 sm:grid-cols-[1fr_140px_1fr_auto]"
                  >
                    <select
                      value={row.item_id}
                      onChange={e => handleItemChange(index, e.target.value)}
                      className={selectClassName}
                      disabled={isSubmitting}
                      aria-label={`Item ${index + 1}`}
                    >
                      <option value="">Select item</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={row.requested_quantity}
                      onChange={e =>
                        setLineItems(prev => {
                          const next = [...prev]
                          next[index] = {
                            ...next[index],
                            requested_quantity: e.target.value,
                          }
                          return next
                        })
                      }
                      placeholder="Requested qty"
                      className={selectClassName}
                      disabled={isSubmitting}
                      aria-label={`Requested quantity ${index + 1}`}
                    />

                    <select
                      value={row.unit_id}
                      onChange={e =>
                        setLineItems(prev => {
                          const next = [...prev]
                          next[index] = {
                            ...next[index],
                            unit_id: e.target.value,
                          }
                          return next
                        })
                      }
                      className={selectClassName}
                      disabled={isSubmitting}
                      aria-label={`Unit ${index + 1}`}
                    >
                      <option value="">Select unit (optional)</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => removeLineItem(index)}
                      disabled={isSubmitting || lineItems.length === 1}
                      aria-label={`Remove row ${index + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
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
              {mode === "create" ? "Submit Out Request" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
