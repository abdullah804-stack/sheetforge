"use client";

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

interface EntityDef {
  name: string;
  singularName: string;
  sourceSheet: string;
  fields: FieldDef[];
}

interface MetricDef {
  label: string;
  type: string;
  field?: string;
  entity: string;
}

interface ChartDef {
  label: string;
  type: string;
  entity: string;
  groupBy: string;
  value?: string;
}

interface ApplicationDefinition {
  applicationType: string;
  applicationName: string;
  primaryEntity: EntityDef;
  supportingEntities: EntityDef[];
  dashboard: { metrics: MetricDef[] };
  charts: ChartDef[];
  confidence: string;
  notes: string;
}

interface ParsedWorkbook {
  filename: string;
  sheetCount: number;
  sheets: { name: string; rowCount: number; columnCount: number }[];
}

export default function AIReasoning({
  definition,
  workbook,
}: {
  definition: ApplicationDefinition;
  workbook: ParsedWorkbook;
}) {
  const confidence = definition.confidence || "medium";
  const confidenceColor =
    confidence === "high"
      ? "bg-green-100 text-green-700"
      : confidence === "low"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
          <h3 className="text-sm font-semibold text-gray-900">
            AI Analysis
          </h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${confidenceColor}`}>
          {confidence} confidence
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Row label="Application" value={definition.applicationType} />
          <Row label="Primary entity" value={definition.primaryEntity.name} />
          <Row
            label="Source sheet"
            value={definition.primaryEntity.sourceSheet}
          />
        </div>

        {/* Fields */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Fields identified
          </p>
          <div className="border border-gray-200 rounded divide-y">
            {definition.primaryEntity.fields.map((f) => (
              <div
                key={f.name}
                className="px-3 py-2 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-400 text-xs font-mono">✓</span>
                  <span className="text-gray-900 font-medium truncate">
                    {f.label}
                  </span>
                  <span className="text-gray-400 text-xs truncate font-mono">
                    {f.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                    {f.type}
                  </span>
                  {f.searchable && (
                    <span className="text-[10px] text-gray-500">search</span>
                  )}
                  {f.filterable && (
                    <span className="text-[10px] text-gray-500">filter</span>
                  )}
                  {f.sortable && (
                    <span className="text-[10px] text-gray-500">sort</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard metrics */}
        {definition.dashboard.metrics.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Dashboard metrics
            </p>
            <div className="flex flex-wrap gap-2">
              {definition.dashboard.metrics.map((m, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-700"
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-gray-400 ml-1.5">
                    {m.type}
                    {m.field ? ` · ${m.field}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {definition.charts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Charts proposed
            </p>
            <div className="flex flex-wrap gap-2">
              {definition.charts.map((c, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-700"
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="text-gray-400 ml-1.5">
                    {c.type} · {c.groupBy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compatibility */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Compatibility
          </p>
          <div className="space-y-1.5 text-sm">
            <CompatLine level="ok" label="Tabular data" note="Supported" />
            <CompatLine level="ok" label="Text / numeric" note="Supported" />
            <CompatLine level="ok" label="Dates" note="Supported" />
            <CompatLine
              level="warn"
              label="Formulas"
              note="Values imported, no live recalculation"
            />
            <CompatLine
              level="no"
              label="VBA / macros"
              note="Not supported"
            />
          </div>
        </div>

        {/* Notes from AI */}
        {definition.notes && (
          <div className="border-l-2 border-gray-300 pl-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Notes from AI
            </p>
            <p className="text-sm text-gray-600 italic">
              "{definition.notes}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
    </div>
  );
}

function CompatLine({
  level,
  label,
  note,
}: {
  level: "ok" | "warn" | "no";
  label: string;
  note: string;
}) {
  const icon = level === "ok" ? "✓" : level === "warn" ? "⚠" : "✗";
  const color =
    level === "ok"
      ? "text-green-600"
      : level === "warn"
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-xs ${color} w-3`}>{icon}</span>
      <span className="text-gray-700 w-40">{label}</span>
      <span className="text-gray-500 text-xs">{note}</span>
    </div>
  );
}