/** Client-safe report export helpers (CSV / Excel-compatible / printable PDF). */

export type ExportColumn<T> = {
  key: keyof T | string;
  label: string;
  get?: (row: T) => string | number | boolean | null | undefined;
};

function cellValue<T>(row: T, col: ExportColumn<T>): string {
  const raw = col.get
    ? col.get(row)
    : (row as Record<string, unknown>)[col.key as string];
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "object") return JSON.stringify(raw);
  const str = String(raw);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const headerLine = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
  const lines = rows.map((row) => columns.map((c) => cellValue(row, c)).join(","));
  return [headerLine, ...lines].join("\r\n");
}

export function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const csv = "\uFEFF" + toCsv(rows, columns);
  downloadBlob(csv, filename.endsWith(".csv") ? filename : `${filename}.csv`, "text/csv;charset=utf-8");
}

/** Excel-compatible SpreadsheetML (.xls) — opens natively in Excel without extra deps. */
export function exportExcel<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const headerCells = columns
    .map((c) => `<Cell><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`)
    .join("");

  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const v = colRaw(row, c);
          const isNum = typeof v === "number" && Number.isFinite(v);
          return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${escapeXml(
            v === null || v === undefined ? "" : String(v)
          )}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const name = filename.endsWith(".xls") || filename.endsWith(".xlsx")
    ? filename.replace(/\.xlsx$/, ".xls")
    : `${filename}.xls`;
  downloadBlob(xml, name, "application/vnd.ms-excel");
}

function colRaw<T>(row: T, col: ExportColumn<T>): unknown {
  if (col.get) return col.get(row);
  return (row as Record<string, unknown>)[col.key as string];
}

/** Minimal printable PDF via browser print dialog on a generated document. */
export function exportPdf(title: string, htmlBody: string, filename: string) {
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) {
    // Fallback: download HTML the user can print to PDF
    downloadBlob(
      `<!DOCTYPE html><html><head><title>${title}</title></head><body>${htmlBody}</body></html>`,
      filename.endsWith(".html") ? filename : `${filename}.html`,
      "text/html"
    );
    return;
  }
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f5f5f5; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Generated ${new Date().toLocaleString("en-IN")} · Vantoo Admin</p>
  ${htmlBody}
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); }<\/script>
</body>
</html>`);
  w.document.close();
}

export function tableHtmlFromRows<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const head = columns.map((c) => `<th>${c.label}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => {
            const v = colRaw(row, c);
            return `<td>${v === null || v === undefined ? "" : String(v)}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
