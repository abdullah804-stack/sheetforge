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

export default function AnalysisResult({
  analysis,
}: {
  analysis: ParsedWorkbook;
}) {
  const sheet = analysis.sheets[0];

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">
          Detected structure
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Rows" value={sheet.rowCount} />
          <StatCard label="Columns" value={sheet.columnCount} />
          <StatCard label="Sheets" value={analysis.sheetCount} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">
          Columns
        </h3>
        <div className="border border-gray-200 rounded divide-y">
          {sheet.columns.map((col) => (
            <div
              key={col.name}
              className="p-3 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{col.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {col.uniqueValues} unique · {col.emptyPercent}% empty
                  {col.min !== undefined && col.max !== undefined && (
                    <> · {col.min}–{col.max}</>
                  )}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-mono">
                {col.detectedType}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">
          Sample data
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
          Showing 5 of {sheet.rowCount} rows
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-200 rounded p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}