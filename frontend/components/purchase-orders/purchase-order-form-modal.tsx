"use client"

import * as React from "react"
import { FileText, Loader2, Plus, Trash2, Upload, X } from "lucide-react"

import {
  calculatePurchaseOrderAmounts,
  formatCurrency,
  ORDER_TYPE_OPTIONS,
  selectClassName,
  textareaClassName,
} from "@/components/purchase-orders/purchase-order-constants"
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
  createPurchaseOrder,
  updatePurchaseOrder,
} from "@/services/purchase-orders"
import { getRequisitions } from "@/services/requisitions"
import { cn } from "@/lib/utils"
import type { Item } from "@/types/items"
import type { PurchaseOrder, PurchaseOrderType } from "@/types/purchase-orders"
import type { Requisition } from "@/types/requisitions"
import type { Unit } from "@/types/units"

type FormMode = "create" | "edit"

type LineItemRow = {
  key: string
  item_id: string
  quantity: string
  unit_id: string
  per_unit_amount: string
  discount_amount: string
}

type PurchaseOrderFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FormMode
  purchaseOrder?: PurchaseOrder | null
  items: Item[]
  units: Unit[]
  onSuccess: () => void
  onCreated?: (purchaseOrder: PurchaseOrder) => void
}

function createEmptyRow(): LineItemRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    item_id: "",
    quantity: "",
    unit_id: "",
    per_unit_amount: "",
    discount_amount: "",
  }
}

function rowsFromRequisitions(requisitions: Requisition[]): LineItemRow[] {
  if (!requisitions.length) return [createEmptyRow()]

  const merged = new Map<number, LineItemRow>()

  for (const requisition of requisitions) {
    for (const item of requisition.items) {
      const existing = merged.get(item.item_id)

      if (existing) {
        existing.quantity = String(
          Number(existing.quantity) + Number(item.quantity)
        )
      } else {
        merged.set(item.item_id, {
          key: `req-item-${item.item_id}`,
          item_id: String(item.item_id),
          quantity: String(item.quantity),
          unit_id: item.unit_id ? String(item.unit_id) : "",
          per_unit_amount: "",
          discount_amount: "",
        })
      }
    }
  }

  return merged.size ? Array.from(merged.values()) : [createEmptyRow()]
}

function descriptionFromRequisitions(requisitions: Requisition[]) {
  return requisitions
    .map(req => req.description?.trim() || req.req_id)
    .filter(Boolean)
    .join("; ")
}

function rowsFromPurchaseOrder(po: PurchaseOrder): LineItemRow[] {
  if (!po.items.length) return [createEmptyRow()]

  return po.items.map(item => ({
    key: `existing-${item.id}`,
    item_id: String(item.item_id),
    quantity: String(item.quantity),
    unit_id: item.unit_id ? String(item.unit_id) : "",
    per_unit_amount:
      item.per_unit_amount !== null ? String(item.per_unit_amount) : "",
    discount_amount:
      item.discount_amount !== null ? String(item.discount_amount) : "",
  }))
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

export function PurchaseOrderFormModal({
  open,
  onOpenChange,
  mode,
  purchaseOrder,
  items,
  units,
  onSuccess,
  onCreated,
}: PurchaseOrderFormModalProps) {
  const [description, setDescription] = React.useState("")
  const [orderType, setOrderType] =
    React.useState<PurchaseOrderType>("by_requisition")
  const [paidAmount, setPaidAmount] = React.useState("")
  const [discountAmount, setDiscountAmount] = React.useState("")
  const [lineItems, setLineItems] = React.useState<LineItemRow[]>([
    createEmptyRow(),
  ])
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [approvedRequisitions, setApprovedRequisitions] = React.useState<
    Requisition[]
  >([])
  const [selectedRequisitionIds, setSelectedRequisitionIds] = React.useState<
    number[]
  >([])
  const [isLoadingRequisitions, setIsLoadingRequisitions] =
    React.useState(false)

  React.useEffect(() => {
    if (!open) return

    if (mode === "edit" && purchaseOrder) {
      setDescription(purchaseOrder.description ?? "")
      setOrderType(purchaseOrder.order_type)
      setPaidAmount(
        purchaseOrder.paid_amount !== null
          ? String(purchaseOrder.paid_amount)
          : ""
      )
      setDiscountAmount(
        purchaseOrder.discount_amount !== null
          ? String(purchaseOrder.discount_amount)
          : ""
      )
      setLineItems(rowsFromPurchaseOrder(purchaseOrder))
    } else {
      setDescription("")
      setOrderType("by_requisition")
      setPaidAmount("")
      setDiscountAmount("")
      setLineItems([createEmptyRow()])
      setSelectedRequisitionIds([])
    }

    setAttachmentFile(null)
    setFormError(null)
  }, [open, mode, purchaseOrder])

  React.useEffect(() => {
    if (!open || mode !== "create" || orderType !== "by_requisition") {
      return
    }

    let cancelled = false

    const fetchApprovedRequisitions = async () => {
      setIsLoadingRequisitions(true)

      try {
        const result = await getRequisitions({
          status: "approved",
          limit: 200,
          sortBy: "created_at",
          sortOrder: "desc",
        })

        if (!cancelled) {
          setApprovedRequisitions(result.data)
        }
      } catch {
        if (!cancelled) {
          setApprovedRequisitions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRequisitions(false)
        }
      }
    }

    fetchApprovedRequisitions()

    return () => {
      cancelled = true
    }
  }, [open, mode, orderType])

  const handleOrderTypeChange = (value: PurchaseOrderType) => {
    setOrderType(value)
    setSelectedRequisitionIds([])
    setLineItems([createEmptyRow()])
  }

  const applySelectedRequisitions = (ids: number[]) => {
    const selected = approvedRequisitions.filter(req => ids.includes(req.id))
    setLineItems(rowsFromRequisitions(selected))

    if (selected.length) {
      setDescription(descriptionFromRequisitions(selected))
    } else {
      setLineItems([createEmptyRow()])
      setDescription("")
    }
  }

  const toggleRequisition = (requisitionId: number) => {
    setFormError(null)

    const next = selectedRequisitionIds.includes(requisitionId)
      ? selectedRequisitionIds.filter(id => id !== requisitionId)
      : [...selectedRequisitionIds, requisitionId]

    setSelectedRequisitionIds(next)
    applySelectedRequisitions(next)
  }

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

  const buildItemsPayload = () => {
    const payload = []

    for (const row of lineItems) {
      const itemId = Number(row.item_id)
      const quantity = Number(row.quantity)

      if (!row.item_id || !row.quantity) return null

      if (Number.isNaN(itemId) || Number.isNaN(quantity) || quantity <= 0) {
        return null
      }

      payload.push({
        item_id: itemId,
        quantity,
        unit_id: row.unit_id ? Number(row.unit_id) : null,
        per_unit_amount: parseOptionalNumber(row.per_unit_amount),
        discount_amount: parseOptionalNumber(row.discount_amount),
      })
    }

    return payload.length ? payload : null
  }

  const previewItems = React.useMemo(() => {
    const payload = buildItemsPayload()
    if (!payload) {
      return {
        total_amount: 0,
        paid_amount: 0,
        due_amount: 0,
        discount_amount: 0,
      }
    }
    return calculatePurchaseOrderAmounts(
      payload,
      parseOptionalNumber(discountAmount),
      parseOptionalNumber(paidAmount)
    )
  }, [lineItems, discountAmount, paidAmount])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const authUser = getAuthUser()
    if (!authUser) {
      setFormError("You must be logged in to create a purchase order")
      return
    }

    if (
      mode === "create" &&
      orderType === "by_requisition" &&
      selectedRequisitionIds.length === 0
    ) {
      setFormError(
        "Select at least one approved requisition to create this purchase order"
      )
      return
    }

    const itemsPayload = buildItemsPayload()
    if (!itemsPayload) {
      setFormError(
        orderType === "by_requisition"
          ? "Selected requisition must have at least one valid line item"
          : "Add at least one line item with item and quantity selected"
      )
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const basePayload = {
      description: description.trim() || null,
      order_type: orderType,
      paid_amount: parseOptionalNumber(paidAmount),
      discount_amount: parseOptionalNumber(discountAmount),
      items: itemsPayload,
    }

    try {
      if (mode === "create") {
        const created = await createPurchaseOrder(
          {
            ...basePayload,
            created_by: authUser.id,
            status: "pending",
            requisition_ids:
              orderType === "by_requisition" ? selectedRequisitionIds : undefined,
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

      if (purchaseOrder) {
        await updatePurchaseOrder(
          purchaseOrder.id,
          basePayload,
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
            : "Failed to save purchase order"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const existingAttachmentUrl = purchaseOrder?.attachment
    ? getAssetUrl(purchaseOrder.attachment)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "New Purchase Order" : "Edit Purchase Order"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create a purchase order with line items, amounts, and optional attachment."
                : "Update purchase order details. Only pending orders can be edited."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="po-description"
                  className="text-sm font-medium text-[#373B44]"
                >
                  Description
                </label>
                <textarea
                  id="po-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Purpose or notes for this purchase order"
                  className={textareaClassName}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="po-order-type"
                  className="text-sm font-medium text-[#373B44]"
                >
                  Order Type
                </label>
                <select
                  id="po-order-type"
                  value={orderType}
                  onChange={e =>
                    handleOrderTypeChange(e.target.value as PurchaseOrderType)
                  }
                  className={selectClassName}
                  disabled={isSubmitting}
                >
                  {ORDER_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "create" && orderType === "by_requisition" && (
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-[#373B44]">
                      Requisitions <span className="text-red-500">*</span>
                    </label>
                    {selectedRequisitionIds.length > 0 && (
                      <span className="text-xs font-medium text-[#4DC591]">
                        {selectedRequisitionIds.length} selected
                      </span>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-lg border border-[#e8eaed] bg-white">
                    {isLoadingRequisitions ? (
                      <p className="px-4 py-6 text-center text-sm text-[#8b95a5]">
                        Loading approved requisitions...
                      </p>
                    ) : approvedRequisitions.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-amber-700">
                        No approved requisitions available. Approve a
                        requisition first or use Direct order type.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#e8eaed]">
                        {approvedRequisitions.map(requisition => {
                          const isSelected = selectedRequisitionIds.includes(
                            requisition.id
                          )

                          return (
                            <li key={requisition.id}>
                              <label
                                className={cn(
                                  "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-[#f8f9fb]",
                                  isSelected && "bg-[#e8f8f0]/60"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleRequisition(requisition.id)
                                  }
                                  disabled={isSubmitting}
                                  className="mt-1 size-4 rounded border-[#d5dae1] text-[#4DC591] focus:ring-[#4DC591]/30"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium text-[#373B44]">
                                    {requisition.req_id}
                                  </span>
                                  <span className="mt-0.5 block text-sm text-[#5c6370]">
                                    {requisition.description ||
                                      "No description"}
                                  </span>
                                  <span className="mt-1 block text-xs text-[#8b95a5]">
                                    {requisition.items.length} item
                                    {requisition.items.length === 1 ? "" : "s"}
                                  </span>
                                </span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  <p className="text-xs text-[#8b95a5]">
                    Select one or more approved requisitions. Once used in a
                    purchase order they are marked as ordered and will not
                    appear here again.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="po-discount"
                  className="text-sm font-medium text-[#373B44]"
                >
                  Header Discount
                </label>
                <input
                  id="po-discount"
                  type="number"
                  min="0"
                  step="any"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(e.target.value)}
                  placeholder="0.00"
                  className={selectClassName}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="po-paid"
                  className="text-sm font-medium text-[#373B44]"
                >
                  Paid Amount
                </label>
                <input
                  id="po-paid"
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  className={selectClassName}
                  disabled={isSubmitting}
                />
              </div>

              <div className="rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-3 sm:col-span-2">
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <p className="text-[#5c6370]">
                    Total:{" "}
                    <span className="font-semibold text-[#373B44]">
                      {formatCurrency(previewItems.total_amount)}
                    </span>
                  </p>
                  <p className="text-[#5c6370]">
                    Paid:{" "}
                    <span className="font-semibold text-[#373B44]">
                      {formatCurrency(previewItems.paid_amount)}
                    </span>
                  </p>
                  <p className="text-[#5c6370]">
                    Due:{" "}
                    <span className="font-semibold text-[#373B44]">
                      {formatCurrency(previewItems.due_amount)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#373B44]">
                    Line Items <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-[#8b95a5]">
                    Item, quantity, unit, unit price, and line discount
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLineItems(prev => [...prev, createEmptyRow()])}
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
                    className="grid gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-3 lg:grid-cols-[1.4fr_90px_1fr_110px_110px_auto]"
                  >
                    <select
                      value={row.item_id}
                      onChange={e => handleItemChange(index, e.target.value)}
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
                    >
                      <option value="">Unit</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.per_unit_amount}
                      onChange={e =>
                        setLineItems(prev => {
                          const next = [...prev]
                          next[index] = {
                            ...next[index],
                            per_unit_amount: e.target.value,
                          }
                          return next
                        })
                      }
                      placeholder="Unit price"
                      className={selectClassName}
                      disabled={isSubmitting}
                    />

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.discount_amount}
                      onChange={e =>
                        setLineItems(prev => {
                          const next = [...prev]
                          next[index] = {
                            ...next[index],
                            discount_amount: e.target.value,
                          }
                          return next
                        })
                      }
                      placeholder="Discount"
                      className={selectClassName}
                      disabled={isSubmitting}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setLineItems(prev =>
                          prev.length === 1
                            ? prev
                            : prev.filter((_, i) => i !== index)
                        )
                      }
                      disabled={isSubmitting || lineItems.length === 1}
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
              {mode === "create" ? "Create Purchase Order" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
