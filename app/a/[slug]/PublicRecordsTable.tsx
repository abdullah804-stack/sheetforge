"use client";

import { useState, useMemo } from "react";
import PublicRecordCard from "./PublicRecordCard";
import { styleForValue, styleClasses, ConditionalRule } from "@/lib/conditional/rules";
interface FieldDef {
  name: string;
  label: string;
  type: string;
  visible: boolean;
  searchable: boolean;
  sortable: boolean;
}

interface Record_ {
  id: string;
  data: Record<string, any>;
}

type ViewMode = "grid" | "list";

export default function PublicRecordsTable({
  fields,
  records,
  rules = [],
}: {
  fields: FieldDef[];
  records: Record_[];
  rules?: ConditionalRule[];
}) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [view, setView] = useState<ViewMode>("grid");

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
      {/* Toolbar */}
      <div className="p-4 border-b flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm w-full sm:w-64"
        />

        <div className="flex items-center gap-2 ml-auto">
          <div className="border border-gray-200 rounded-md p-0.5 flex">
            <button
              onClick={() => setView("grid")}
              className={`px-2.5 py-1 text-xs rounded ${
                view === "grid"
                  ? "theme-accent-bg text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-2.5 py-1 text-xs rounded ${
                view === "list"
                  ? "theme-accent-bg text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              List
            </button>
          </div>

          <p className="text-sm text-gray-500 hidden sm:block">
            {filtered.length}
            {filtered.length !== records.length ? ` of ${records.length}` : ""}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-16 text-center text-sm text-gray-500">
          {records.length === 0
            ? "No records to show."
            : "No matches for your search."}
        </div>
      ) : view === "grid" ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
                        <PublicRecordCard
              key={r.id}
              record={r}
              fields={fields}
              rules={rules}
            />
          ))}
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
                                    {visibleFields.map((f) => {
                    const style = styleForValue(rules, f.name, r.data[f.name]);
                    const cls = styleClasses(style);
                    return (
                      <td
                        key={f.name}
                        className={`px-4 py-2 whitespace-nowrap ${
                          cls || "text-gray-700"
                        }`}
                      >
                        {formatValue(r.data[f.name], f.type)}
                      </td>
                    );
                  })}
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
  if (type === "currency") {
    const n = Number(value);
    return isNaN(n) ? String(value) : `$${n.toFixed(2)}`;
  }
  if (type === "date") {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return String(value);
    }
  }
  return String(value);
}