import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { brand } from "@/lib/brand"
import type { PurchaseOrder } from "@/types/purchase-orders"

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
  brandName: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  brandTagline: { color: "#c8ccd4", fontSize: 9, marginTop: 4 },
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
  amountRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
    backgroundColor: brand.greenLight,
    borderRadius: 4,
    padding: 12,
  },
  amountCard: { flex: 1 },
  amountLabel: { fontSize: 8, color: brand.muted, textTransform: "uppercase" },
  amountValue: { fontSize: 12, fontWeight: "bold", color: brand.dark, marginTop: 4 },
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
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  tableRowAlt: { backgroundColor: brand.surface },
  tableCell: { fontSize: 8, color: brand.slate },
  tableCellBold: { fontSize: 8, fontWeight: "bold", color: brand.dark },
  colIndex: { width: "5%" },
  colItem: { width: "28%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "12%" },
  colPrice: { width: "15%", textAlign: "right" },
  colDisc: { width: "12%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  signatureRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
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
  signatureName: { fontSize: 9, fontWeight: "bold", color: brand.dark },
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

function formatAmount(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return Number(value).toFixed(2)
}

function formatStatus(status: PurchaseOrder["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatOrderType(type: PurchaseOrder["order_type"]) {
  return type === "by_requisition" ? "By Requisition" : "Direct"
}

type PurchaseOrderVoucherDocumentProps = {
  purchaseOrder: PurchaseOrder
}

export function PurchaseOrderVoucherDocument({
  purchaseOrder,
}: PurchaseOrderVoucherDocumentProps) {
  const generatedAt = formatPdfDate(new Date().toISOString())

  return (
    <Document
      title={`${purchaseOrder.po_number} - Purchase Order Voucher`}
      author="AssetIQ EV Warehouse"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brandName}>AssetIQ</Text>
              <Text style={styles.brandTagline}>
                EV Warehouse — Purchase Order Voucher
              </Text>
            </View>
            <View>
              <Text style={styles.voucherLabel}>PO Number</Text>
              <Text style={styles.voucherId}>{purchaseOrder.po_number}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>
              {formatStatus(purchaseOrder.status)}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Order Type</Text>
            <Text style={styles.metaValue}>
              {formatOrderType(purchaseOrder.order_type)}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Created On</Text>
            <Text style={styles.metaValue}>
              {formatPdfDate(purchaseOrder.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Created By</Text>
            <Text style={styles.metaValue}>
              {purchaseOrder.created_by_name ??
                `User #${purchaseOrder.created_by}`}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Approved By</Text>
            <Text style={styles.metaValue}>
              {purchaseOrder.approved_by_name ??
                (purchaseOrder.approved_by
                  ? `User #${purchaseOrder.approved_by}`
                  : "Pending")}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Received By</Text>
            <Text style={styles.metaValue}>
              {purchaseOrder.received_by_name ??
                (purchaseOrder.received_by
                  ? `User #${purchaseOrder.received_by}`
                  : "Pending")}
            </Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>
              {formatAmount(purchaseOrder.total_amount)}
            </Text>
          </View>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Paid Amount</Text>
            <Text style={styles.amountValue}>
              {formatAmount(purchaseOrder.paid_amount)}
            </Text>
          </View>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Due Amount</Text>
            <Text style={styles.amountValue}>
              {formatAmount(purchaseOrder.due_amount)}
            </Text>
          </View>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Discount</Text>
            <Text style={styles.amountValue}>
              {formatAmount(purchaseOrder.discount_amount)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>
            {purchaseOrder.description?.trim() ||
              "No additional description provided."}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colDisc]}>Disc.</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {purchaseOrder.items.map((item, index) => (
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
                {item.unit_name ?? "—"}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatAmount(item.per_unit_amount)}
              </Text>
              <Text style={[styles.tableCell, styles.colDisc]}>
                {formatAmount(item.discount_amount)}
              </Text>
              <Text style={[styles.tableCellBold, styles.colTotal]}>
                {formatAmount(item.total_amount)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Authorization</Text>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Prepared By</Text>
            <Text style={styles.signatureName}>
              {purchaseOrder.created_by_name ??
                `User #${purchaseOrder.created_by}`}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Approved By</Text>
            <Text style={styles.signatureName}>
              {purchaseOrder.approved_by_name ?? "—"}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Received By</Text>
            <Text style={styles.signatureName}>
              {purchaseOrder.received_by_name ?? "—"}
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {generatedAt} · AssetIQ EV Warehouse
          </Text>
          <Text style={styles.watermark}>OFFICIAL PO VOUCHER</Text>
        </View>
      </Page>
    </Document>
  )
}
