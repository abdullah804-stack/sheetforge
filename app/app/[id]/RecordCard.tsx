"use client";
import Link from "next/link";
import { styleForValue, styleClasses, ConditionalRule } from "@/lib/conditional/rules";
interface FieldDef {
  name: string;
  label: string;
  type: string;
  visible: boolean;
}

interface Record_ {
  id: string;
  data: Record<string, any>;
}

export default function RecordCard({
  record,
  fields,
  applicationId,
  onEdit,
  onDelete,
  readOnly = false,
  rules = [],
}: {
  record: Record_;
  fields: FieldDef[];
  applicationId: string;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
  rules?: ConditionalRule[];
}) {
  const visibleFields = fields.filter((f) => f.visible);

  // Pick fields for the card display
  const titleField = pickTitleField(visibleFields);
  const chipFields = visibleFields.filter((f) => isChipField(f, titleField));
  const numberFields = visibleFields.filter((f) => isNumberField(f));
  const statusField = visibleFields.find((f) => isStatusField(f));

  const title = titleField ? String(record.data[titleField.name] ?? "") : "—";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition group">
      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
        {title || "(untitled)"}
      </h3>

      {/* Status chip */}
      {statusField && record.data[statusField.name] && (
        <span
          className={`inline-block text-[10px] px-2 py-0.5 rounded-full mb-2 ${statusColor(
            String(record.data[statusField.name])
          )}`}
        >
          {String(record.data[statusField.name])}
        </span>
      )}

      {/* Chip fields (short text) */}
      {chipFields.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {chipFields.slice(0, 3).map((f) => (
            <span
              key={f.name}
              className="text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5"
            >
              {String(record.data[f.name] ?? "—")}
            </span>
          ))}
        </div>
      )}

      {/* Number fields */}
            {numberFields.length > 0 && (
        <div className="flex items-baseline gap-3 mb-3">
          {numberFields.slice(0, 2).map((f) => {
            const style = styleForValue(rules, f.name, record.data[f.name]);
            const cls = styleClasses(style);
            return (
              <div key={f.name}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                  {f.label}
                </p>
                <p
                  className={`text-sm font-medium px-1.5 py-0.5 rounded ${
                    cls || "text-gray-900"
                  }`}
                >
                  {formatValue(record.data[f.name], f.type)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Link
          href={`/app/${applicationId}/record/${record.id}`}
          className="text-xs text-gray-600 hover:text-gray-900 font-medium"
        >
          View details
        </Link>
        {!readOnly && (
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={onEdit}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-gray-400 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function pickTitleField(fields: FieldDef[]): FieldDef | null {
  // Prefer a field named "name", "title", "product", etc.
  const preferred = fields.find((f) =>
    /^(name|title|product|customer|employee|item)$/i.test(f.name)
  );
  if (preferred) return preferred;

  // Fall back to the first text field
  return fields.find((f) => f.type === "text") || fields[0] || null;
}

function isChipField(f: FieldDef, titleField: FieldDef | null): boolean {
  if (titleField && f.name === titleField.name) return false;
  return f.type === "text";
}

function isNumberField(f: FieldDef): boolean {
  return (
    f.type === "currency" ||
    f.type === "integer" ||
    f.type === "decimal"
  );
}

function isStatusField(f: FieldDef): boolean {
  return /status|state|stage/i.test(f.name) && f.type !== "integer";
}

function statusColor(value: string): string {
  const v = value.toLowerCase();
  if (/(active|ok|good|approved|complete|done|paid|live)/.test(v))
    return "bg-green-50 text-green-700";
  if (/(inactive|pending|draft|waiting|review|paused)/.test(v))
    return "bg-yellow-50 text-yellow-700";
  if (/(cancelled|failed|error|inactive|blocked|closed)/.test(v))
    return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-600";
}

function formatValue(value: any, type: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "currency") {
    const n = Number(value);
    return isNaN(n) ? String(value) : `$${n.toFixed(2)}`;
  }
  if (type === "integer" || type === "decimal") {
    return String(value);
  }
  return String(value);
}