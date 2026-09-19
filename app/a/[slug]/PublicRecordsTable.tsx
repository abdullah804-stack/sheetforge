"use client";

import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import PublicRecordCard from "./PublicRecordCard";
import { styleForValue, styleClasses, ConditionalRule } from "@/lib/conditional/rules";
import FieldValue from "@/lib/fields/FieldValue";

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

function stagger(ms: number): CSSProperties {
  return {
    animationDelay: `${ms}ms`,
    transitionDelay: `${ms}ms`,
    animationFillMode: "both",
  };
}

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

  const toggleBase =
    "px-2.5 py-1 text-xs font-medium rounded transition-all duration-150";
  const toggleActive = "bg-white shadow-sm text-gray-900";
  const toggleInactive = "text-gray-500 hover:text-gray-900";

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
        />

        <div className="flex items-center gap-2 ml-auto">
          <div className="bg-gray-100 rounded-md p-0.5 flex">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`${toggleBase} ${
                view === "grid" ? toggleActive : toggleInactive
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`${toggleBase} ${
                view === "list" ? toggleActive : toggleInactive
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
        <div className="px-6 py-16 flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-3">
            {records.length === 0 ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900">
            Nothing to show
          </p>
          <p className="mt-1 text-sm text-gray-500 max-w-xs">
            {records.length === 0
              ? "There are no records here yet."
              : "No records match your search. Try a different term."}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r, i) => (
            <div
              key={r.id}
              className="animate-fade-up h-full"
              style={stagger(Math.min(i * 30, 300))}
            >
              <PublicRecordCard record={r} fields={fields} rules={rules} />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {visibleFields.map((f) => (
                  <th
                    key={f.name}
                    onClick={() => f.sortable && handleSort(f.name)}
                    className={`px-4 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap transition-colors ${
                      f.sortable
                        ? "cursor-pointer select-none hover:bg-gray-100"
                        : ""
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
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 transition-colors"
                >
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
                        <FieldValue
                          value={r.data[f.name]}
                          type={f.type}
                          compact
                        />
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