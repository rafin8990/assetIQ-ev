import { pdf } from "@react-pdf/renderer"

import { PurchaseOrderVoucherDocument } from "@/components/purchase-orders/purchase-order-voucher-pdf"
import type { PurchaseOrder } from "@/types/purchase-orders"

export async function downloadPurchaseOrderVoucher(
  purchaseOrder: PurchaseOrder
) {
  const blob = await pdf(
    <PurchaseOrderVoucherDocument purchaseOrder={purchaseOrder} />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${purchaseOrder.po_number}-voucher.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
