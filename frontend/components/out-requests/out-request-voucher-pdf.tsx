import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { brand } from "@/lib/brand"
import { companyInfo, getCompanyLogoUrl } from "@/lib/company"
import type { OutRequest } from "@/types/out-requests"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: brand.dark,
    backgroundColor: "#ffffff",
  },
  headerBar: {
    backgroundColor: brand.dark,
    borderRadius: 4,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 6 },
  brandName: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  brandTagline: { color: "#c8ccd4", fontSize: 8, marginTop: 3 },
  brandAddress: { color: "#c8ccd4", fontSize: 7, marginTop: 2 },
  voucherLabel: {
    color: brand.green,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "right",
  },
  voucherId: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "right",
  },
  metaRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  metaCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 4,
    padding: 10,
    backgroundColor: brand.surface,
  },
  metaLabel: {
    fontSize: 8,
    color: brand.muted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaValue: { fontSize: 10, fontWeight: "bold", color: brand.dark },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: brand.dark,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: brand.green,
  },
  descriptionBox: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 18,
    minHeight: 48,
  },
  descriptionText: { fontSize: 10, color: brand.slate, lineHeight: 1.5 },
  table: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: brand.dark,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  tableRowAlt: { backgroundColor: brand.surface },
  tableCell: { fontSize: 8, color: brand.slate },
  tableCellBold: { fontSize: 8, fontWeight: "bold", color: brand.dark },
  colIndex: { width: "6%" },
  colItem: { width: "28%" },
  colReq: { width: "12%", textAlign: "right" },
  colOut: { width: "12%", textAlign: "right" },
  colUnit: { width: "12%", textAlign: "right" },
  colAvail: { width: "12%", textAlign: "right" },
  colStatus: { width: "18%", textAlign: "right" },
  signatureRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  signatureBlock: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: brand.dark,
    paddingTop: 8,
    minHeight: 56,
  },
  signatureLabel: {
    fontSize: 8,
    color: brand.muted,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  signatureName: { fontSize: 9, color: brand.dark, fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: brand.muted },
  watermark: { fontSize: 8, color: brand.green, fontWeight: "bold" },
})

function formatPdfDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

type OutRequestVoucherDocumentProps = {
  outRequest: OutRequest
}

export function OutRequestVoucherDocument({
  outRequest,
}: OutRequestVoucherDocumentProps) {
  const generatedAt = formatPdfDate(new Date().toISOString())
  const totalRequested = outRequest.items.reduce(
    (sum, item) => sum + Number(item.requested_quantity),
    0
  )

  return (
    <Document
      title={`${outRequest.request_id} - Out Request Voucher`}
      author={companyInfo.name}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.headerTop}>
            <View style={styles.brandBlock}>
              <Image src={getCompanyLogoUrl()} style={styles.logo} />
              <View>
                <Text style={styles.brandName}>{companyInfo.name}</Text>
                <Text style={styles.brandTagline}>
                  {companyInfo.tagline} — Out Request Voucher
                </Text>
                <Text style={styles.brandAddress}>{companyInfo.address}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.voucherLabel}>Request No.</Text>
              <Text style={styles.voucherId}>{outRequest.request_id}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>
              {formatStatus(outRequest.status)}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Created On</Text>
            <Text style={styles.metaValue}>
              {formatPdfDate(outRequest.created_at)}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Reference ID</Text>
            <Text style={styles.metaValue}>#{outRequest.id}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Requested By</Text>
            <Text style={styles.metaValue}>
              {outRequest.requested_by_name ??
                `User #${outRequest.requested_by}`}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Approved By</Text>
            <Text style={styles.metaValue}>
              {outRequest.approved_by_name ??
                (outRequest.approved_by
                  ? `User #${outRequest.approved_by}`
                  : "Pending approval")}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Out By</Text>
            <Text style={styles.metaValue}>
              {outRequest.out_by_name ??
                (outRequest.out_by ? `User #${outRequest.out_by}` : "—")}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>
            {outRequest.description?.trim() ||
              "No additional description provided."}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Requested Items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.colReq]}>Req Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colOut]}>Out Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, styles.colAvail]}>
              Stock
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>
              Status
            </Text>
          </View>

          {outRequest.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                ...(index % 2 === 1 ? [styles.tableRowAlt] : []),
              ]}
            >
              <Text style={[styles.tableCell, styles.colIndex]}>
                {index + 1}
              </Text>
              <Text style={[styles.tableCellBold, styles.colItem]}>
                {item.item_name ?? `Item #${item.item_id}`}
              </Text>
              <Text style={[styles.tableCell, styles.colReq]}>
                {item.requested_quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colOut]}>
                {item.out_quantity ?? "—"}
              </Text>
              <Text style={[styles.tableCell, styles.colUnit]}>
                {item.unit_name ?? "—"}
              </Text>
              <Text style={[styles.tableCell, styles.colAvail]}>
                {item.available_quantity ?? 0}
              </Text>
              <Text style={[styles.tableCell, styles.colStatus]}>
                {formatStatus(item.status)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Authorization</Text>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Requested By</Text>
            <Text style={styles.signatureName}>
              {outRequest.requested_by_name ??
                `User #${outRequest.requested_by}`}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Approved By</Text>
            <Text style={styles.signatureName}>
              {outRequest.approved_by_name ?? "—"}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Out By</Text>
            <Text style={styles.signatureName}>
              {outRequest.out_by_name ?? "—"}
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated {generatedAt} · Total requested qty: {totalRequested}
          </Text>
          <Text style={styles.watermark}>OFFICIAL VOUCHER</Text>
        </View>
      </Page>
    </Document>
  )
}
