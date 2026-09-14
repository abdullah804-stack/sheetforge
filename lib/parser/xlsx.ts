import * as XLSX from "xlsx";
import type { ParsedWorkbook, ParsedSheet, ColumnProfile } from "./csv";

export async function parseXLSX(
  buffer: ArrayBuffer,
  filename: string
): Promise<ParsedWorkbook> {
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Workbook contains no sheets");
  }

  const sheets: ParsedSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert sheet to array-of-arrays (raw values)
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
    });

    // Skip completely empty sheets
    if (rows.length === 0) continue;
    const nonEmptyRows = rows.filter((r) =>
      r.some((cell) => cell !== "" && cell !== null && cell !== undefined)
    );
    if (nonEmptyRows.length === 0) continue;

    // Detect header row — take the first non-empty row
    const headerRowIndex = rows.findIndex((r) =>
      r.some((cell) => cell !== "" && cell !== null && cell !== undefined)
    );
    if (headerRowIndex === -1) continue;

    const headerRow = rows[headerRowIndex];
    const headers = headerRow.map((h, i) =>
      h === "" || h === null || h === undefined ? `Column${i + 1}` : String(h)
    );

    // Data rows = everything after the header
    const dataRows = rows.slice(headerRowIndex + 1);

    // Build row objects: { header1: value1, header2: value2 }
    const rowObjects: Record<string, string>[] = [];
    for (const row of dataRows) {
      const obj: Record<string, string> = {};
      let hasValue = false;
      headers.forEach((header, i) => {
        const cell = row[i];
        const value =
          cell === null || cell === undefined ? "" : String(cell).trim();
        obj[header] = value;
        if (value !== "") hasValue = true;
      });
      if (hasValue) rowObjects.push(obj);
    }

    if (rowObjects.length === 0) {
      // Sheet has only headers, no data — still record it
      sheets.push({
        name: sheetName,
        rowCount: 0,
        columnCount: headers.length,
        headers,
        sampleRows: [],
        columns: headers.map((h, i) => emptyProfile(h, i)),
      });
      continue;
    }

    const columns: ColumnProfile[] = headers.map((header, index) =>
      profileColumn(header, index, rowObjects)
    );

    sheets.push({
      name: sheetName,
      rowCount: rowObjects.length,
      columnCount: headers.length,
      headers,
      sampleRows: rowObjects,
      columns,
    });
  }

  if (sheets.length === 0) {
    throw new Error("No usable sheets detected in the workbook");
  }

  return {
    filename,
    sheetCount: sheets.length,
    sheets,
  };
}

function emptyProfile(name: string, index: number): ColumnProfile {
  return {
    name,
    index,
    detectedType: "unknown",
    totalValues: 0,
    emptyValues: 0,
    emptyPercent: 0,
    uniqueValues: 0,
    uniquePercent: 0,
    sampleValues: [],
  };
}

function profileColumn(
  name: string,
  index: number,
  rows: Record<string, string>[]
): ColumnProfile {
  const values: string[] = [];
  let emptyCount = 0;

  for (const row of rows) {
    const value = row[name];
    if (value === undefined || value === null || value.trim() === "") {
      emptyCount++;
    } else {
      values.push(value.trim());
    }
  }

  const totalValues = rows.length;
  const uniqueSet = new Set(values);
  const sampleValues = Array.from(uniqueSet).slice(0, 5);
  const detectedType = detectType(values);

  const profile: ColumnProfile = {
    name,
    index,
    detectedType,
    totalValues,
    emptyValues: emptyCount,
    emptyPercent: round((emptyCount / totalValues) * 100),
    uniqueValues: uniqueSet.size,
    uniquePercent: round((uniqueSet.size / Math.max(values.length, 1)) * 100),
    sampleValues,
  };

  if (detectedType === "integer" || detectedType === "decimal") {
    const numbers = values.map((v) => Number(v)).filter((n) => !isNaN(n));
    if (numbers.length > 0) {
      profile.min = Math.min(...numbers);
      profile.max = Math.max(...numbers);
      profile.average = round(
        numbers.reduce((sum, n) => sum + n, 0) / numbers.length
      );
    }
  }

  return profile;
}

function detectType(values: string[]): ColumnProfile["detectedType"] {
  if (values.length === 0) return "unknown";
  const sample = values.slice(0, 100);

  const allIntegers = sample.every((v) => /^-?\d+$/.test(v));
  if (allIntegers) return "integer";

  const allDecimals = sample.every((v) => /^-?\d+(\.\d+)?$/.test(v));
  if (allDecimals) return "decimal";

  const allBooleans = sample.every((v) =>
    /^(true|false|yes|no|y|n|0|1)$/i.test(v)
  );
  if (allBooleans) return "boolean";

  const allDates = sample.every((v) => {
    const d = new Date(v);
    return !isNaN(d.getTime()) && v.length >= 6;
  });
  if (allDates && sample.length > 0) return "date";

  return "text";
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}