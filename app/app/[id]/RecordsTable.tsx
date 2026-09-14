"use client";

import { useState, useMemo } from "react";

interface FieldDef {
  name: string;
  label: string;
  type: string;
  required: boolean;
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  visible: boolean;
}

interface Record {
  id: string;
  data: Record<string, any>;
}

export default function RecordsTable({
  applicationId,
  entityName,
  fields,
  initialRecords,
}: {
  applicationId: string;
  entityName: string;
  fields: FieldDef[];
  initialRecords: Record[];
}) {
  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visibleFields = fields.filter((f) => f.visible);

  const filtered = useMemo(() => {
    let result = records;

    if (search.trim()) {
      const q = search.toLowerCase();
      const searchable = fields.filter((f) => f.searchable);
      const searchFields = searchable.length > 0 ? searchable : fields;

      result = result.filter((r) =>
        searchFields.some((f) =>
          String(r.data[f.name] ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const av = a.data[sortField];
        const bv = b.data[sortField];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;

        const an = Number(av);
        const bn = Number(bv);
        const bothNumeric = !isNaN(an) && !isNaN(bn);

        let cmp: number;
        if (bothNumeric) {
          cmp = an - bn;
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [records, search, sortField, sortDir, fields]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 text-gray-900 rounded px-3 py-2 text-sm w-64"
        />
        <p className="text-sm text-gray-500">
          {filtered.length} of {records.length} records
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500 text-sm">
          {records.length === 0
            ? "No records imported yet."
            : "No matches for your search."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {visibleFields.map((f) => (
                  <th
                    key={f.name}
                    onClick={() => f.sortable && handleSort(f.name)}
                    className={`px-4 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap ${
                      f.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                    }`}
                  >
                    {f.label}
                    {sortField === f.name && (
                      <span className="ml-1 text-gray-400">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  {visibleFields.map((f) => (
                    <td
                      key={f.name}
                      className="px-4 py-2 text-gray-700 whitespace-nowrap"
                    >
                      {formatValue(r.data[f.name], f.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatValue(value: any, type: string): string {
  if (value === null || value === undefined || value === "") return "—";

  switch (type) {
    case "currency":
      const n = Number(value);
      return isNaN(n) ? String(value) : `$${n.toFixed(2)}`;
    case "integer":
    case "decimal":
      return String(value);
    case "date":
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    default:
      return String(value);
  }
}