import { pdf } from "@react-pdf/renderer"

import { RequisitionVoucherDocument } from "@/components/requisitions/requisition-voucher-pdf"
import type { Requisition } from "@/types/requisitions"

export async function downloadRequisitionVoucher(requisition: Requisition) {
  const blob = await pdf(
    <RequisitionVoucherDocument requisition={requisition} />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${requisition.req_id}-voucher.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
