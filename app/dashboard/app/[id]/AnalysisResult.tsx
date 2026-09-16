"use client";

import { useState } from "react";

interface ColumnProfile {
  name: string;
  detectedType: string;
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

interface ParsedSheet {
  name: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  sampleRows: Record<string, string>[];
  columns: ColumnProfile[];
}

interface ParsedWorkbook {
  filename: string;
  sheetCount: number;
  sheets: ParsedSheet[];
}

/**
 * Translates our internal type names to plain user language.
 */
function friendlyType(t: string): string {
  switch (t) {
    case "text":
      return "Text";
    case "longtext":
      return "Long text";
    case "integer":
      return "Number";
    case "decimal":
      return "Number";
    case "currency":
      return "Money";
    case "boolean":
      return "Yes / No";
    case "date":
      return "Date";
    case "datetime":
      return "Date & time";
    case "email":
      return "Email";
    case "url":
      return "Link";
    case "select":
      return "Category";
    default:
      return "Text";
  }
}

export function AnalysisResult({ analysis }: { analysis: ParsedWorkbook }) {
  const [activeSheet, setActiveSheet] = useState(0);
  const sheet = analysis.sheets[activeSheet];

  if (!sheet) {
    return <p className="text-sm text-gray-500">No data found.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">
          What's inside your file
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Tab"
            value={analysis.sheetCount === 1 ? "1" : String(analysis.sheetCount)}
          />
          <StatCard label="Records" value={String(sheet.rowCount)} />
          <StatCard label="Fields" value={String(sheet.columnCount)} />
        </div>
      </div>

      {analysis.sheets.length > 1 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Tabs</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.sheets.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSheet(i)}
                className={`px-3 py-1.5 text-sm rounded border ${
                  i === activeSheet
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                {s.name}{" "}
                <span className="text-xs opacity-70">({s.rowCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">
          Your columns
        </h3>
        <div className="border border-gray-200 rounded divide-y">
          {sheet.columns.map((col) => (
            <div
              key={col.name}
              className="p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {col.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {col.emptyPercent === 0
                    ? "No empty values"
                    : `${col.emptyPercent}% of rows are empty`}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                {friendlyType(col.detectedType)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">
          A preview
        </h3>
        <div className="border border-gray-200 rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {sheet.headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sheet.sampleRows.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {sheet.headers.map((h) => (
                    <td
                      key={h}
                      className="px-3 py-2 text-gray-700 whitespace-nowrap"
                    >
                      {row[h] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Showing the first 5 of {sheet.rowCount}{" "}
          {sheet.rowCount === 1 ? "record" : "records"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

export default AnalysisResult;