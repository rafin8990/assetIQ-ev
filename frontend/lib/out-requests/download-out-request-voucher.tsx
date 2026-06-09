import { pdf } from "@react-pdf/renderer"

import { OutRequestVoucherDocument } from "@/components/out-requests/out-request-voucher-pdf"
import type { OutRequest } from "@/types/out-requests"

export async function downloadOutRequestVoucher(outRequest: OutRequest) {
  const blob = await pdf(
    <OutRequestVoucherDocument outRequest={outRequest} />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${outRequest.request_id}-voucher.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
