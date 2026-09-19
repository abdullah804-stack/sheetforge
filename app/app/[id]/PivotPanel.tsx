"use client";

import { useState, useMemo } from "react";
import {
  computePivot,
  formatPivotNumber,
  PivotConfig,
  AggregateType,
} from "@/lib/pivot/compute";

interface FieldDef {
  name: string;
  label: string;
  type: string;
}

interface Record_ {
  id: string;
  data: Record<string, any>;
}

const AGGREGATES: { id: AggregateType; label: string }[] = [
  { id: "count", label: "Count of records" },
  { id: "sum", label: "Sum of" },
  { id: "average", label: "Average of" },
  { id: "min", label: "Minimum of" },
  { id: "max", label: "Maximum of" },
];

export default function PivotPanel({
  records,
  fields,
}: {
  records: Record_[];
  fields: FieldDef[];
}) {
  const groupableFields = fields.filter(
    (f) => f.type === "text" || f.type === "select"
  );
  const numericFields = fields.filter(
    (f) =>
      f.type === "integer" ||
      f.type === "decimal" ||
      f.type === "currency"
  );

  const [groupBy, setGroupBy] = useState<string>(
    groupableFields[0]?.name || ""
  );
  const [aggregate, setAggregate] = useState<AggregateType>("count");
  const [valueField, setValueField] = useState<string>(
    numericFields[0]?.name || ""
  );
  const [groupBy2, setGroupBy2] = useState<string>("");

  const config: PivotConfig = useMemo(
    () => ({
      groupBy,
      aggregate,
      valueField:
        aggregate === "count" ? undefined : valueField || undefined,
      groupBy2: groupBy2 || undefined,
    }),
    [groupBy, aggregate, valueField, groupBy2]
  );

  const result = useMemo(() => {
    if (!groupBy) return null;
    try {
      return computePivot(records, config);
    } catch {
      return null;
    }
  }, [records, config, groupBy]);

  const needsValueField = aggregate !== "count";

  if (groupableFields.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        No grouping fields available. Add a text or category field to use
        pivots.
      </div>
    );
  }

  return (
    <div className="p-5">
      {/* Config row — 3 dropdowns, plain English */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Group by
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm"
          >
            {groupableFields.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Show
          </label>
          <select
            value={aggregate}
            onChange={(e) => setAggregate(e.target.value as AggregateType)}
            className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm"
          >
            {AGGREGATES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {needsValueField && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Which number?
            </label>
            <select
              value={valueField}
              onChange={(e) => setValueField(e.target.value)}
              className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm"
            >
              {numericFields.length === 0 && (
                <option value="">No number fields</option>
              )}
              {numericFields.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Optional second breakdown */}
      <div className="mb-6">
        <details className="group">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-900 select-none">
            + Add a second breakdown (optional)
          </summary>
          <div className="mt-3">
            <select
              value={groupBy2}
              onChange={(e) => setGroupBy2(e.target.value)}
              className="border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm w-full md:w-64"
            >
              <option value="">None</option>
              {groupableFields
                .filter((f) => f.name !== groupBy)
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    Break down by {f.label}
                  </option>
                ))}
            </select>
          </div>
        </details>
      </div>

      {/* Result */}
      {!result || result.rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          No data to summarize.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">
                  {fields.find((f) => f.name === groupBy)?.label || "Group"}
                </th>
                {groupBy2 ? (
                  result.subGroupKeys.map((k) => (
                    <th
                      key={k}
                      className="text-right px-4 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap"
                    >
                      {k}
                    </th>
                  ))
                ) : (
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
                    {result.aggregateLabel}
                  </th>
                )}
                {groupBy2 && (
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
                    Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900 font-medium">
                    {row.group}
                  </td>
                  {groupBy2 ? (
                    <>
                      {result.subGroupKeys.map((k) => (
                        <td
                          key={k}
                          className="px-4 py-2 text-right text-gray-700"
                        >
                          {formatPivotNumber(row.subGroups?.[k] ?? 0)}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right text-gray-900 font-medium">
                        {formatPivotNumber(row.value)}
                      </td>
                    </>
                  ) : (
                    <td className="px-4 py-2 text-right text-gray-900 font-medium">
                      {formatPivotNumber(row.value)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                  Total
                </td>
                {groupBy2 ? (
                  <>
                    {result.subGroupKeys.map((k) => (
                      <td
                        key={k}
                        className="px-4 py-2 text-right text-gray-900 font-semibold"
                      >
                        {formatPivotNumber(
                          result.rows.reduce(
                            (a, r) => a + (r.subGroups?.[k] ?? 0),
                            0
                          )
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right text-gray-900 font-semibold">
                      {formatPivotNumber(result.total)}
                    </td>
                  </>
                ) : (
                  <td className="px-4 py-2 text-right text-gray-900 font-semibold">
                    {formatPivotNumber(result.total)}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Friendly hint */}
      <p className="text-xs text-gray-400 mt-4">
        Pivot tables summarize your data. Try grouping by Category to see
        totals per category.
      </p>
    </div>
  );
}