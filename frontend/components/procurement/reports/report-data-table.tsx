import { cn } from "@/lib/utils"

import type { ReportTableColumn, ReportTableRow } from "./report-utils"

type ReportDataTableProps = {
  columns: ReportTableColumn[]
  rows: ReportTableRow[]
  emptyMessage?: string
}

export function ReportDataTable({
  columns,
  rows,
  emptyMessage = "No records found for the selected criteria.",
}: ReportDataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e8eaed]">
      <table className="min-w-full divide-y divide-[#e8eaed] text-sm">
        <thead className="bg-[#373B44]">
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center"
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e8eaed] bg-white">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-[#8b95a5]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={`${rowIndex}-${String(row[columns[0]?.key ?? "sl"])}`}
                className={rowIndex % 2 === 1 ? "bg-[#f8f9fb]" : undefined}
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-[#373B44]",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center"
                    )}
                  >
                    {String(row[column.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
