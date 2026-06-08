"use client"

import * as React from "react"
import { Download, FileCheck2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { downloadPurchaseOrderVoucher } from "@/lib/purchase-orders/download-purchase-order-voucher"
import type { PurchaseOrder } from "@/types/purchase-orders"

type PurchaseOrderVoucherCardProps = {
  purchaseOrder: PurchaseOrder
  highlight?: boolean
}

export function PurchaseOrderVoucherCard({
  purchaseOrder,
  highlight = false,
}: PurchaseOrderVoucherCardProps) {
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)

    try {
      await downloadPurchaseOrderVoucher(purchaseOrder)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate voucher PDF"
      setError(message)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card
      className={
        highlight
          ? "border-[#4DC591]/40 bg-gradient-to-br from-[#e8f8f0] to-white p-5 shadow-sm"
          : "border-[#e8eaed] p-5"
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#373B44]">
            <FileCheck2 className="size-5 text-[#4DC591]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#373B44]">
              Purchase Order Voucher
            </h3>
            <p className="mt-1 max-w-xl text-sm text-[#5c6370]">
              Download an official PDF voucher for{" "}
              <span className="font-semibold text-[#373B44]">
                {purchaseOrder.po_number}
              </span>
              . Includes items, amounts, approval details, and signature blocks.
            </p>
            {highlight && (
              <p className="mt-2 text-sm font-medium text-[#2d9f6f]">
                Purchase order created successfully. Save or print this voucher
                for your records.
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="shrink-0 bg-[#373B44] hover:bg-[#4a4f5c]"
        >
          {isDownloading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
          Download Voucher PDF
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  )
}
