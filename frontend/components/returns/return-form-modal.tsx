"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import {
  selectClassName,
  textareaClassName,
} from "@/components/returns/return-constants"
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
import { getOutRequest, getOutRequests } from "@/services/out-requests"
import {
  createReturnRequest,
  getReturnRequests,
  updateReturnRequest,
} from "@/services/returns"
import type { OutRequest } from "@/types/out-requests"
import type { ReturnRequest, ReturnRequestItemPayload } from "@/types/returns"

type FormMode = "create" | "edit"

type ReturnLineRow = {
  key: string
  out_request_item_id: number
  item_id: number
  item_name: string
  unit_id: number | null
  unit_name: string | null
  out_quantity: number
  already_returned: number
  returnable_quantity: number
  return_quantity: string
}

type ReturnFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FormMode
  returnRequest?: ReturnRequest | null
  onSuccess: () => void
}

function buildRowsFromOutRequest(
  outRequest: OutRequest,
  alreadyReturnedByItemId: Map<number, number>,
  existingRows?: ReturnLineRow[]
): ReturnLineRow[] {
  const eligibleItems = outRequest.items.filter(
    item => Number(item.out_quantity ?? 0) > 0
  )

  return eligibleItems.map(item => {
    const outQty = Number(item.out_quantity ?? 0)
    const alreadyReturned = alreadyReturnedByItemId.get(item.id) ?? 0
    const returnable = Math.max(0, outQty - alreadyReturned)
    const existing = existingRows?.find(
      row => row.out_request_item_id === item.id
    )

    return {
      key: `item-${item.id}`,
      out_request_item_id: item.id,
      item_id: item.item_id,
      item_name: item.item_name ?? `Item #${item.item_id}`,
      unit_id: item.unit_id,
      unit_name: item.unit_name ?? null,
      out_quantity: outQty,
      already_returned: alreadyReturned,
      returnable_quantity: returnable,
      return_quantity: existing?.return_quantity ?? "",
    }
  })
}

async function getAlreadyReturnedMap(
  outRequestId: number,
  excludeReturnRequestId?: number
) {
  const result = await getReturnRequests({
    outRequestId,
    status: "approved",
    limit: 200,
  })

  const map = new Map<number, number>()

  for (const returnReq of result.data) {
    if (excludeReturnRequestId && returnReq.id === excludeReturnRequestId) {
      continue
    }

    for (const item of returnReq.items) {
      const current = map.get(item.out_request_item_id) ?? 0
      map.set(
        item.out_request_item_id,
        current + Number(item.return_quantity)
      )
    }
  }

  return map
}

function isEligibleOutRequest(outRequest: OutRequest) {
  return outRequest.items.some(item => Number(item.out_quantity ?? 0) > 0)
}

export function ReturnFormModal({
  open,
  onOpenChange,
  mode,
  returnRequest,
  onSuccess,
}: ReturnFormModalProps) {
  const [description, setDescription] = React.useState("")
  const [outRequestId, setOutRequestId] = React.useState("")
  const [eligibleOutRequests, setEligibleOutRequests] = React.useState<
    OutRequest[]
  >([])
  const [lineItems, setLineItems] = React.useState<ReturnLineRow[]>([])
  const [isLoadingOutRequests, setIsLoadingOutRequests] = React.useState(false)
  const [isLoadingItems, setIsLoadingItems] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const loadEligibleOutRequests = React.useCallback(async () => {
    setIsLoadingOutRequests(true)

    try {
      const authUser = getAuthUser()
      const result = await getOutRequests({
        limit: 200,
        sortBy: "created_at",
        sortOrder: "desc",
        requestedBy: authUser?.id,
      })

      const eligible: OutRequest[] = []

      for (const outRequest of result.data) {
        if (outRequest.status === "cancelled") continue

        if (outRequest.items.some(item => Number(item.out_quantity ?? 0) > 0)) {
          eligible.push(outRequest)
          continue
        }

        const full = await getOutRequest(outRequest.id)
        if (isEligibleOutRequest(full)) {
          eligible.push(full)
        }
      }

      setEligibleOutRequests(eligible)
    } catch {
      setEligibleOutRequests([])
    } finally {
      setIsLoadingOutRequests(false)
    }
  }, [])

  const loadOutRequestItems = React.useCallback(
    async (selectedOutRequestId: number, excludeReturnId?: number) => {
      setIsLoadingItems(true)
      setFormError(null)

      try {
        const [outRequest, alreadyReturnedMap] = await Promise.all([
          getOutRequest(selectedOutRequestId),
          getAlreadyReturnedMap(selectedOutRequestId, excludeReturnId),
        ])

        setLineItems(
          buildRowsFromOutRequest(outRequest, alreadyReturnedMap)
        )
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load out request items"
        setFormError(message)
        setLineItems([])
      } finally {
        setIsLoadingItems(false)
      }
    },
    []
  )

  React.useEffect(() => {
    if (!open) return

    loadEligibleOutRequests()

    if (mode === "edit" && returnRequest) {
      setDescription(returnRequest.description ?? "")
      setOutRequestId(String(returnRequest.out_request_id))
      loadOutRequestItems(returnRequest.out_request_id, returnRequest.id).then(
        () => {
          setLineItems(prev =>
            prev.map(row => {
              const existing = returnRequest.items.find(
                item => item.out_request_item_id === row.out_request_item_id
              )
              return existing
                ? {
                    ...row,
                    return_quantity: String(existing.return_quantity),
                  }
                : row
            })
          )
        }
      )
    } else {
      setDescription("")
      setOutRequestId("")
      setLineItems([])
    }

    setFormError(null)
  }, [open, mode, returnRequest, loadEligibleOutRequests, loadOutRequestItems])

  const handleOutRequestChange = async (value: string) => {
    setOutRequestId(value)
    setLineItems([])

    if (!value) return

    await loadOutRequestItems(Number(value))
  }

  const buildItemsPayload = (): ReturnRequestItemPayload[] | null => {
    const payload: ReturnRequestItemPayload[] = []

    for (const row of lineItems) {
      const quantity = Number(row.return_quantity)

      if (!row.return_quantity.trim()) {
        continue
      }

      if (Number.isNaN(quantity) || quantity <= 0) {
        return null
      }

      if (quantity > row.returnable_quantity) {
        return null
      }

      payload.push({
        out_request_item_id: row.out_request_item_id,
        item_id: row.item_id,
        return_quantity: quantity,
        unit_id: row.unit_id,
      })
    }

    return payload.length ? payload : null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const authUser = getAuthUser()
    if (!authUser) {
      setFormError("You must be logged in to submit a return request")
      return
    }

    if (!outRequestId) {
      setFormError("Select an out request")
      return
    }

    const itemsPayload = buildItemsPayload()
    if (!itemsPayload?.length) {
      setFormError(
        "Add at least one item with a valid return quantity within the returnable limit"
      )
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      if (mode === "create") {
        await createReturnRequest({
          out_request_id: Number(outRequestId),
          description: description.trim() || null,
          requested_by: authUser.id,
          items: itemsPayload,
        })
      } else if (returnRequest) {
        await updateReturnRequest(returnRequest.id, {
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
            : "Failed to save return request"
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
              {mode === "create" ? "New Return" : "Edit Return"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Record items returning from a processed out request."
                : "Update return details. Only pending returns can be edited."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="return-out-request"
                className="text-sm font-medium text-[#373B44]"
              >
                Out Request <span className="text-red-500">*</span>
              </label>
              <select
                id="return-out-request"
                value={outRequestId}
                onChange={e => handleOutRequestChange(e.target.value)}
                className={selectClassName}
                disabled={
                  isSubmitting || isLoadingOutRequests || mode === "edit"
                }
              >
                <option value="">
                  {isLoadingOutRequests
                    ? "Loading out requests..."
                    : "Select out request"}
                </option>
                {eligibleOutRequests.map(outRequest => (
                  <option key={outRequest.id} value={outRequest.id}>
                    {outRequest.request_id}
                    {outRequest.description
                      ? ` — ${outRequest.description}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="return-description"
                className="text-sm font-medium text-[#373B44]"
              >
                Description
              </label>
              <textarea
                id="return-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Notes for this return"
                className={textareaClassName}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[#373B44]">
                  Return Items <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-[#8b95a5]">
                  Enter return quantity for each item (max = returnable qty)
                </p>
              </div>

              {isLoadingItems ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-[#4DC591]" />
                </div>
              ) : lineItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#e8eaed] p-4 text-sm text-[#8b95a5]">
                  Select an out request to load returnable items.
                </p>
              ) : (
                <div className="space-y-2">
                  {lineItems.map(row => (
                    <div
                      key={row.key}
                      className="grid gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-3 sm:grid-cols-[1fr_100px_100px_100px_120px]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#373B44]">
                          {row.item_name}
                        </p>
                        <p className="text-xs text-[#8b95a5]">
                          Out: {row.out_quantity}
                          {row.unit_name ? ` ${row.unit_name}` : ""} · Returned:{" "}
                          {row.already_returned} · Max: {row.returnable_quantity}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0.01"
                        max={row.returnable_quantity}
                        step="any"
                        value={row.return_quantity}
                        onChange={e =>
                          setLineItems(prev =>
                            prev.map(item =>
                              item.key === row.key
                                ? {
                                    ...item,
                                    return_quantity: e.target.value,
                                  }
                                : item
                            )
                          )
                        }
                        placeholder="Return qty"
                        className={selectClassName}
                        disabled={isSubmitting || row.returnable_quantity <= 0}
                        aria-label={`Return quantity for ${row.item_name}`}
                      />
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
            <Button type="submit" disabled={isSubmitting || isLoadingItems}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {mode === "create" ? "Submit Return" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
