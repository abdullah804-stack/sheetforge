"use client";

import { useState, useMemo } from "react";
import RecordCard from "./RecordCard";

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

interface Record_ {
  id: string;
  data: Record<string, any>;
}

type ViewMode = "grid" | "list";

export default function RecordsTable({
  applicationId,
  entityName,
  fields,
  initialRecords,
}: {
  applicationId: string;
  entityName: string;
  fields: FieldDef[];
  initialRecords: Record_[];
}) {
  const [records, setRecords] = useState<Record_[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [view, setView] = useState<ViewMode>("grid");

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record_ | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<Record_ | null>(null);

  const visibleFields = fields.filter((f) => f.visible);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filtered = useMemo(() => {
    let result = records;

    // Search across searchable fields
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

    // Apply field filters (AND)
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      result = result.filter(
        (r) =>
          String(r.data[key] ?? "").toLowerCase() === value.toLowerCase()
      );
    }

    // Sort
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
  }, [records, search, sortField, sortDir, filters, fields]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setFilters({});
  }

  function openAddForm() {
    setEditingRecord(null);
    setFormData({});
    setError("");
    setFormOpen(true);
  }

  function openEditForm(record: Record_) {
    setEditingRecord(record);
    const initial: Record<string, string> = {};
    for (const f of fields) {
      initial[f.name] = record.data[f.name] ?? "";
    }
    setFormData(initial);
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingRecord(null);
    setFormData({});
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    for (const f of fields) {
      if (f.required && !formData[f.name]?.trim()) {
        setError(`${f.label} is required`);
        setSaving(false);
        return;
      }
    }

    const url = "/api/records";
    const method = editingRecord ? "PATCH" : "POST";
    const body = editingRecord
      ? { recordId: editingRecord.id, data: formData }
      : { applicationId, entityName, data: formData };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Save failed");
      setSaving(false);
      return;
    }

    const result = await res.json();

    if (editingRecord) {
      setRecords(
        records.map((r) => (r.id === result.record.id ? result.record : r))
      );
    } else {
      setRecords([...records, result.record]);
    }

    setSaving(false);
    closeForm();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;

    const res = await fetch(`/api/records?recordId=${deleteConfirm.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setError("Delete failed");
      setDeleteConfirm(null);
      return;
    }

    setRecords(records.filter((r) => r.id !== deleteConfirm.id));
    setDeleteConfirm(null);
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
          className="border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm w-full sm:w-56"
        />

        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`px-3 py-2 rounded-md text-sm border transition ${
            activeFilterCount > 0
              ? "border-black bg-black text-white"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1.5 text-xs opacity-90">
              ({activeFilterCount})
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <div className="border border-gray-200 rounded-md p-0.5 flex">
            <button
              onClick={() => setView("grid")}
              className={`px-2.5 py-1 text-xs rounded ${
                view === "grid"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-2.5 py-1 text-xs rounded ${
                view === "list"
                  ? "bg-gray-900 text-white"
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

          <button
            onClick={openAddForm}
            className="bg-black text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields
              .filter(
                (f) =>
                  f.filterable || f.type === "text" || f.type === "select"
              )
              .map((f) => (
                <FilterField
                  key={f.name}
                  field={f}
                  value={filters[f.name] ?? ""}
                  onChange={(v) =>
                    setFilters({ ...filters, [f.name]: v })
                  }
                  records={records}
                />
              ))}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-gray-500 hover:text-gray-900 underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Body */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center">
          <p className="text-sm text-gray-500 mb-4">
            {records.length === 0
              ? "No records yet."
              : activeFilterCount > 0 || search.trim()
                ? "No records match your filters."
                : "No matches for your search."}
          </p>
          {records.length === 0 && (
            <button
              onClick={openAddForm}
              className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition"
            >
              Add your first record
            </button>
          )}
          {(activeFilterCount > 0 || search.trim()) && (
            <button
              onClick={() => {
                clearFilters();
                setSearch("");
              }}
              className="text-xs text-gray-500 hover:text-gray-900 underline"
            >
              Clear filters and search
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        /* GRID VIEW */
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              fields={fields}
              applicationId={applicationId}
              onEdit={() => openEditForm(r)}
              onDelete={() => setDeleteConfirm(r)}
            />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
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
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
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
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEditForm(r)}
                      className="text-xs text-gray-600 hover:text-gray-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(r)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit form modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSave}>
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingRecord ? "Edit record" : "Add record"}
                </h2>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {error && (
                  <div className="sm:col-span-2 bg-red-50 text-red-600 p-3 rounded text-sm">
                    {error}
                  </div>
                )}

                {fields.map((f) => (
                  <div
                    key={f.name}
                    className={f.type === "longtext" ? "sm:col-span-2" : ""}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.label}
                      {f.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>

                    {f.type === "longtext" ? (
                      <textarea
                        value={formData[f.name] ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [f.name]: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black outline-none"
                      />
                    ) : f.type === "boolean" ? (
                      <select
                        value={formData[f.name] ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [f.name]: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black outline-none"
                      >
                        <option value="">—</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        type={
                          f.type === "integer" ||
                          f.type === "decimal" ||
                          f.type === "currency"
                            ? "number"
                            : f.type === "date" || f.type === "datetime"
                              ? "date"
                              : f.type === "email"
                                ? "email"
                                : "text"
                        }
                        step={
                          f.type === "decimal" || f.type === "currency"
                            ? "0.01"
                            : undefined
                        }
                        value={formData[f.name] ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [f.name]: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="p-6 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                      ? "Save changes"
                      : "Create record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Delete this record?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This can't be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FilterField — renders a dropdown or text input based on options     */
/* ------------------------------------------------------------------ */

function FilterField({
  field,
  value,
  onChange,
  records,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  records: Record_[];
}) {
  const options = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      const v = r.data[field.name];
      if (v !== null && v !== undefined && v !== "") {
        set.add(String(v));
      }
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [records, field.name]);

  const tooMany = options.length > 15;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {field.label}
      </label>
      {tooMany ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type to filter..."
          className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-1.5 text-sm"
        />
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
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