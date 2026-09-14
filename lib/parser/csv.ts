import Papa from "papaparse";

export interface ColumnProfile {
  name: string;
  index: number;
  detectedType: "text" | "integer" | "decimal" | "date" | "boolean" | "unknown";
  totalValues: number;
  emptyValues: number;
  emptyPercent: number;
  uniqueValues: number;
  uniquePercent: number;
  sampleValues: string[];
  min?: number;
  max?: number;
  average?: number;
}

export interface ParsedWorkbook {
  filename: string;
  sheetCount: number;
  sheets: ParsedSheet[];
}

export interface ParsedSheet {
  name: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  sampleRows: Record<string, string>[];
  columns: ColumnProfile[];
}

export async function parseCSV(
  content: string,
  filename: string
): Promise<ParsedWorkbook> {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    console.warn("CSV parse warnings:", result.errors);
  }

  const rows = result.data;
  const headers = result.meta.fields || [];

  if (headers.length === 0) {
    throw new Error("No columns detected in the file");
  }

  if (rows.length === 0) {
    throw new Error("No data rows detected in the file");
  }

  const columns: ColumnProfile[] = headers.map((header, index) => {
    return profileColumn(header, index, rows);
  });

  const sheet: ParsedSheet = {
    name: "Sheet1",
    rowCount: rows.length,
    columnCount: headers.length,
    headers,
    sampleRows: rows,
    columns,
  };

  return {
    filename,
    sheetCount: 1,
    sheets: [sheet],
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

  // Numeric stats for integer/decimal columns
  if (detectedType === "integer" || detectedType === "decimal") {
    const numbers = values
      .map((v) => Number(v))
      .filter((n) => !isNaN(n));

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