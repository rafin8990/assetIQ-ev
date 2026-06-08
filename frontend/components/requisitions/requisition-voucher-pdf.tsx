import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { brand } from "@/lib/brand"
import type { Requisition } from "@/types/requisitions"

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
  brandName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  brandTagline: {
    color: "#c8ccd4",
    fontSize: 9,
    marginTop: 4,
  },
  voucherLabel: {
    color: brand.green,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "right",
  },
  voucherId: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
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
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: brand.dark,
  },
  statusPending: {
    color: "#b45309",
  },
  statusApproved: {
    color: "#2d9f6f",
  },
  statusCancelled: {
    color: "#dc2626",
  },
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
    backgroundColor: "#ffffff",
  },
  descriptionText: {
    fontSize: 10,
    color: brand.slate,
    lineHeight: 1.5,
  },
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
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  tableRowAlt: {
    backgroundColor: brand.surface,
  },
  tableCell: {
    fontSize: 9,
    color: brand.slate,
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: "bold",
    color: brand.dark,
  },
  colIndex: { width: "8%" },
  colItem: { width: "52%" },
  colQty: { width: "20%", textAlign: "right" },
  colUnit: { width: "20%", textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: brand.greenLight,
  },
  summaryText: {
    fontSize: 10,
    fontWeight: "bold",
    color: brand.dark,
  },
  signatureRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    marginBottom: 24,
  },
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
    letterSpacing: 0.6,
    marginBottom: 20,
  },
  signatureName: {
    fontSize: 9,
    color: brand.dark,
    fontWeight: "bold",
  },
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
  footerText: {
    fontSize: 8,
    color: brand.muted,
  },
  watermark: {
    fontSize: 8,
    color: brand.green,
    fontWeight: "bold",
  },
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

function formatStatus(status: Requisition["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusStyle(status: Requisition["status"]) {
  switch (status) {
    case "approved":
      return styles.statusApproved
    case "cancelled":
      return styles.statusCancelled
    default:
      return styles.statusPending
  }
}

type RequisitionVoucherDocumentProps = {
  requisition: Requisition
}

export function RequisitionVoucherDocument({
  requisition,
}: RequisitionVoucherDocumentProps) {
  const totalQty = requisition.items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  )
  const generatedAt = formatPdfDate(new Date().toISOString())

  return (
    <Document
      title={`${requisition.req_id} - Requisition Voucher`}
      author="AssetIQ EV Warehouse"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brandName}>AssetIQ</Text>
              <Text style={styles.brandTagline}>
                EV Warehouse — Material Requisition Voucher
              </Text>
            </View>
            <View>
              <Text style={styles.voucherLabel}>Voucher No.</Text>
              <Text style={styles.voucherId}>{requisition.req_id}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={[styles.metaValue, statusStyle(requisition.status)]}>
              {formatStatus(requisition.status)}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Created On</Text>
            <Text style={styles.metaValue}>
              {formatPdfDate(requisition.created_at)}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Last Updated</Text>
            <Text style={styles.metaValue}>
              {formatPdfDate(requisition.updated_at)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Requested By</Text>
            <Text style={styles.metaValue}>
              {requisition.created_by_name ?? `User #${requisition.created_by}`}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Approved By</Text>
            <Text style={styles.metaValue}>
              {requisition.approved_by_name ??
                (requisition.approved_by
                  ? `User #${requisition.approved_by}`
                  : "Pending approval")}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Reference ID</Text>
            <Text style={styles.metaValue}>#{requisition.id}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Purpose / Description</Text>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>
            {requisition.description?.trim() ||
              "No additional description provided for this requisition."}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Requested Materials</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
          </View>

          {requisition.items.map((item, index) => (
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
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colUnit]}>
                {item.unit_name ?? `Unit #${item.unit_id}`}
              </Text>
            </View>
          ))}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Total line items: {requisition.items.length} | Total quantity:{" "}
              {totalQty}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Authorization</Text>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Requested By</Text>
            <Text style={styles.signatureName}>
              {requisition.created_by_name ?? `User #${requisition.created_by}`}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Approved By</Text>
            <Text style={styles.signatureName}>
              {requisition.approved_by_name ??
                (requisition.approved_by
                  ? `User #${requisition.approved_by}`
                  : "—")}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Received By</Text>
            <Text style={styles.signatureName}> </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {generatedAt} · AssetIQ EV Warehouse Management System
          </Text>
          <Text style={styles.watermark}>OFFICIAL VOUCHER</Text>
        </View>
      </Page>
    </Document>
  )
}
