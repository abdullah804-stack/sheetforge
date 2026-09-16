import * as XLSX from "xlsx";

interface FieldDef {
  name: string;
  label: string;
  type: string;
  visible: boolean;
}

interface EntityDef {
  name: string;
  singularName: string;
  sourceSheet: string;
  fields: FieldDef[];
}

interface Record_ {
  id: string;
  data: Record<string, any>;
}

/**
 * Converts records into a 2D array using the entity's field labels
 * as headers. This preserves the user's original column names.
 */
export function recordsToRows(
  records: Record_[],
  entity: EntityDef
): { headers: string[]; rows: string[][] } {
  const headers = entity.fields.map((f) => f.label);

  const rows = records.map((r) =>
    entity.fields.map((f) => {
      const value = r.data[f.name];
      if (value === null || value === undefined) return "";
      return String(value);
    })
  );

  return { headers, rows };
}

/**
 * Generates a CSV string from records.
 */
export function generateCSV(
  records: Record_[],
  entity: EntityDef
): string {
  const { headers, rows } = recordsToRows(records, entity);

  const escape = (val: string): string => {
    if (val === "") return "";
    const needsQuotes = /[",\n\r]/.test(val);
    if (!needsQuotes) return val;
    return `"${val.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];

  return lines.join("\n");
}

/**
 * Generates an XLSX Buffer from records.
 * Uses the original app name and entity name for sheet name.
 */
export function generateXLSX(
  records: Record_[],
  entity: EntityDef,
  appName: string
): Buffer {
  const { headers, rows } = recordsToRows(records, entity);

  const sheetData: any[][] = [headers, ...rows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();

  // Sheet name (max 31 chars in Excel, no special chars)
  const rawSheetName = entity.name || "Data";
  const sheetName = rawSheetName.replace(/[\\/?*\[\]:]/g, "").slice(0, 31);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Also add a "Summary" sheet with metadata
  const summaryData: any[][] = [
    ["Application", appName],
    ["Entity", entity.name],
    ["Total Records", records.length],
    ["Exported", new Date().toLocaleString()],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return buffer;
}

/**
 * Creates a safe filename based on the app name.
 */
export function safeFilename(appName: string, extension: string): string {
  const base = appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  const date = new Date().toISOString().slice(0, 10);
  return `${base || "export"}-${date}.${extension}`;
}