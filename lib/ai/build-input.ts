import type { ParsedWorkbook } from "@/lib/parser/csv";

export function buildAIInput(workbook: ParsedWorkbook): string {
  const lines: string[] = [];

  lines.push(`WORKBOOK: ${workbook.filename}`);
  lines.push(`SHEETS: ${workbook.sheetCount}`);
  lines.push("");

  for (const sheet of workbook.sheets) {
    lines.push(`--- SHEET: ${sheet.name} ---`);
    lines.push(`Rows: ${sheet.rowCount}`);
    lines.push(`Columns: ${sheet.columnCount}`);
    lines.push("");

    for (const col of sheet.columns) {
      lines.push(
        `Column "${col.name}": type=${col.detectedType}, unique=${col.uniquePercent}%, empty=${col.emptyPercent}%${
          col.min !== undefined ? `, min=${col.min}, max=${col.max}` : ""
        }`
      );
      if (col.sampleValues.length > 0) {
        lines.push(
          `  sample values: ${col.sampleValues.slice(0, 3).join(" | ")}`
        );
      }
    }

    lines.push("");
    lines.push("Sample rows:");
    for (const row of sheet.sampleRows.slice(0, 5)) {
      lines.push(JSON.stringify(row));
    }
    lines.push("");
  }

  return lines.join("\n");
}