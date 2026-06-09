import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type {
  ReportTableColumn,
  ReportTableRow,
} from "@/components/procurement/reports/report-utils"
import { brand } from "@/lib/brand"
import { companyInfo } from "@/lib/company"
import type { ReturnReportSummary } from "@/types/return-reports"

import { formatQuantity } from "./report-utils"

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: brand.dark,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  companyBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: brand.dark,
  },
  companyMeta: {
    fontSize: 8,
    color: brand.muted,
    marginTop: 3,
    lineHeight: 1.4,
  },
  reportBlock: {
    alignItems: "flex-end",
    maxWidth: 220,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: brand.green,
    textTransform: "uppercase",
    textAlign: "right",
  },
  reportSubtitle: {
    fontSize: 8,
    color: brand.muted,
    marginTop: 4,
    textAlign: "right",
    lineHeight: 1.4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    backgroundColor: brand.greenLight,
    borderRadius: 4,
    padding: 10,
  },
  summaryCard: { flex: 1 },
  summaryLabel: {
    fontSize: 7,
    color: brand.muted,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: brand.dark,
    marginTop: 3,
  },
  table: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: brand.dark,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  tableRowAlt: {
    backgroundColor: brand.surface,
  },
  tableCell: {
    fontSize: 8,
    color: brand.dark,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: brand.muted,
  },
  emptyText: {
    padding: 16,
    fontSize: 9,
    color: brand.muted,
    textAlign: "center",
  },
})

type ReturnReportPdfProps = {
  title: string
  subtitle: string
  generatedAt: string
  logoUrl: string
  columns: ReportTableColumn[]
  rows: ReportTableRow[]
  summary: ReturnReportSummary
}

function getFlex(columns: ReportTableColumn[], column: ReportTableColumn) {
  if (column.width) {
    return { width: column.width }
  }

  const totalWeight = columns.reduce(
    (sum, item) => sum + (typeof item.width === "number" ? item.width : 1),
    0
  )
  const weight = typeof column.width === "number" ? column.width : 1

  return { flex: weight / totalWeight }
}

function getAlignStyle(align: ReportTableColumn["align"]) {
  if (align === "right") return { textAlign: "right" as const }
  if (align === "center") return { textAlign: "center" as const }
  return { textAlign: "left" as const }
}

export function ReturnReportDocument({
  title,
  subtitle,
  generatedAt,
  logoUrl,
  columns,
  rows,
  summary,
}: ReturnReportPdfProps) {
  return (
    <Document title={title} author={companyInfo.name} subject={title}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>{companyInfo.name}</Text>
              <Text style={styles.companyMeta}>{companyInfo.tagline}</Text>
              <Text style={styles.companyMeta}>{companyInfo.address}</Text>
              <Text style={styles.companyMeta}>
                {companyInfo.phone} | {companyInfo.email}
              </Text>
            </View>
          </View>

          <View style={styles.reportBlock}>
            <Text style={styles.reportTitle}>{title}</Text>
            <Text style={styles.reportSubtitle}>{subtitle}</Text>
            <Text style={styles.reportSubtitle}>Generated: {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Returns</Text>
            <Text style={styles.summaryValue}>{summary.return_count}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{summary.item_count}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Returned</Text>
            <Text style={styles.summaryValue}>
              {formatQuantity(summary.total_return_quantity)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {columns.map(column => (
              <Text
                key={column.key}
                style={[
                  styles.tableHeaderCell,
                  getFlex(columns, column),
                  getAlignStyle(column.align),
                ]}
              >
                {column.header}
              </Text>
            ))}
          </View>

          {rows.length === 0 ? (
            <Text style={styles.emptyText}>No records found for this report.</Text>
          ) : (
            rows.map((row, rowIndex) => (
              <View
                key={`${rowIndex}-${String(row[columns[0]?.key ?? "sl"])}`}
                style={[
                  styles.tableRow,
                  ...(rowIndex % 2 === 1 ? [styles.tableRowAlt] : []),
                ]}
                wrap={false}
              >
                {columns.map(column => (
                  <Text
                    key={column.key}
                    style={[
                      styles.tableCell,
                      getFlex(columns, column),
                      getAlignStyle(column.align),
                    ]}
                  >
                    {String(row[column.key] ?? "—")}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{companyInfo.name}</Text>
          <Text style={styles.footerText}>Page</Text>
        </View>
      </Page>
    </Document>
  )
}
