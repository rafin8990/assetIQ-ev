"use client"

import * as React from "react"
import { FileText, Loader2, Plus, Trash2, Upload, X } from "lucide-react"

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
import { getAssetUrl } from "@/lib/api/client"
import { ApiError } from "@/lib/api/client"
import { getAuthUser } from "@/lib/auth/token"
import {
  createRequisition,
  updateRequisition,
} from "@/services/requisitions"
import type { Item } from "@/types/items"
import type { Requisition, RequisitionItemPayload } from "@/types/requisitions"
import type { Unit } from "@/types/units"
import {
  selectClassName,
  textareaClassName,
} from "@/components/requisitions/requisition-constants"

type FormMode = "create" | "edit"

type LineItemRow = {
  key: string
  item_id: string
  quantity: string
  unit_id: string
}

type RequisitionFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FormMode
  requisition?: Requisition | null
  items: Item[]
  units: Unit[]
  onSuccess: () => void
  onCreated?: (requisition: Requisition) => void
}

function createEmptyRow(): LineItemRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    item_id: "",
    quantity: "",
    unit_id: "",
  }
}

function rowsFromRequisition(requisition: Requisition): LineItemRow[] {
  if (!requisition.items.length) return [createEmptyRow()]

  return requisition.items.map(item => ({
    key: `existing-${item.id}`,
    item_id: String(item.item_id),
    quantity: String(item.quantity),
    unit_id: String(item.unit_id),
  }))
}

export function RequisitionFormModal({
  open,
  onOpenChange,
  mode,
  requisition,
  items,
  units,
  onSuccess,
  onCreated,
}: RequisitionFormModalProps) {
  const [description, setDescription] = React.useState("")
  const [lineItems, setLineItems] = React.useState<LineItemRow[]>([
    createEmptyRow(),
  ])
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    if (mode === "edit" && requisition) {
      setDescription(requisition.description ?? "")
      setLineItems(rowsFromRequisition(requisition))
    } else {
      setDescription("")
      setLineItems([createEmptyRow()])
    }

    setAttachmentFile(null)
    setFormError(null)
  }, [open, mode, requisition])

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

  const buildItemsPayload = (): RequisitionItemPayload[] | null => {
    const payload: RequisitionItemPayload[] = []

    for (const row of lineItems) {
      const itemId = Number(row.item_id)
      const quantity = Number(row.quantity)
      const unitId = Number(row.unit_id)

      if (!row.item_id || !row.quantity || !row.unit_id) {
        return null
      }

      if (
        Number.isNaN(itemId) ||
        Number.isNaN(quantity) ||
        Number.isNaN(unitId) ||
        quantity <= 0
      ) {
        return null
      }

      payload.push({
        item_id: itemId,
        quantity,
        unit_id: unitId,
      })
    }

    return payload
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const authUser = getAuthUser()
    if (!authUser) {
      setFormError("You must be logged in to create a requisition")
      return
    }

    const itemsPayload = buildItemsPayload()
    if (!itemsPayload?.length) {
      setFormError(
        "Add at least one line item with item, quantity, and unit selected"
      )
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      if (mode === "create") {
        const created = await createRequisition(
          {
            description: description.trim() || null,
            created_by: authUser.id,
            status: "pending",
            items: itemsPayload,
          },
          attachmentFile
        )

        onOpenChange(false)
        if (onCreated) {
          onCreated(created)
        } else {
          onSuccess()
        }
        return
      }

      if (requisition) {
        await updateRequisition(
          requisition.id,
          {
            description: description.trim() || null,
            items: itemsPayload,
          },
          attachmentFile
        )
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save requisition"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const existingAttachmentUrl = requisition?.attachment
    ? getAssetUrl(requisition.attachment)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "New Requisition" : "Edit Requisition"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Request materials by adding line items and an optional attachment."
                : "Update requisition details. Only pending requisitions can be edited."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="req-description"
                className="text-sm font-medium text-[#373B44]"
              >
                Description
              </label>
              <textarea
                id="req-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Purpose or notes for this requisition"
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
                    Select item, quantity, and unit for each row
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
                    className="grid gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-3 sm:grid-cols-[1fr_120px_1fr_auto]"
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
                      value={row.quantity}
                      onChange={e =>
                        setLineItems(prev => {
                          const next = [...prev]
                          next[index] = {
                            ...next[index],
                            quantity: e.target.value,
                          }
                          return next
                        })
                      }
                      placeholder="Qty"
                      className={selectClassName}
                      disabled={isSubmitting}
                      aria-label={`Quantity ${index + 1}`}
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
                      <option value="">Select unit</option>
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

            <div className="space-y-3 rounded-lg border border-dashed border-[#d5dae1] bg-[#f8f9fb] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#373B44]">
                    Attachment
                  </p>
                  <p className="text-xs text-[#8b95a5]">
                    PDF, images, Excel, CSV, or Word (max 10MB)
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#373B44] px-3 py-2 text-sm font-medium text-white hover:bg-[#4a4f5c]">
                  <Upload className="size-4" />
                  {attachmentFile ? "Change File" : "Upload File"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.xls,.xlsx,.csv,.doc,.docx,image/*,application/pdf"
                    className="hidden"
                    onChange={e =>
                      setAttachmentFile(e.target.files?.[0] ?? null)
                    }
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              {mode === "edit" && existingAttachmentUrl && !attachmentFile && (
                <a
                  href={existingAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#4DC591] hover:underline"
                >
                  <FileText className="size-4" />
                  View current attachment
                </a>
              )}

              {attachmentFile && (
                <div className="flex items-center justify-between rounded-md border border-[#e8eaed] bg-white px-3 py-2 text-sm">
                  <span className="truncate text-[#373B44]">
                    {attachmentFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachmentFile(null)}
                    className="text-[#8b95a5] hover:text-[#373B44]"
                    disabled={isSubmitting}
                  >
                    <X className="size-4" />
                  </button>
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
              {mode === "create" ? "Submit Requisition" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
