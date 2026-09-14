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

export function DefinitionPreview({
  definition,
}: {
  definition: ApplicationDefinition;
}) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-2">
          Proposed Application
        </h3>
        <div className="border border-gray-200 rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-gray-900">
              {definition.applicationName}
            </p>
            <span
              className={`text-xs px-2 py-1 rounded ${
                definition.confidence === "high"
                  ? "bg-green-100 text-green-700"
                  : definition.confidence === "low"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {definition.confidence} confidence
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Type: <span className="font-mono">{definition.applicationType}</span>
          </p>
          {definition.notes && (
            <p className="text-xs text-gray-500 mt-2 italic">
              {definition.notes}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Primary Entity: {definition.primaryEntity.name}
        </h4>
        <div className="border border-gray-200 rounded divide-y">
          {definition.primaryEntity.fields.map((f) => (
            <div
              key={f.name}
              className="p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{f.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  {f.name}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                  {f.type}
                </span>
                {f.searchable && <Badge label="search" />}
                {f.filterable && <Badge label="filter" />}
                {f.sortable && <Badge label="sort" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {definition.dashboard.metrics.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Dashboard Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {definition.dashboard.metrics.map((m, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded p-3 text-sm"
              >
                <p className="font-medium text-gray-900">{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {m.type}
                  {m.field ? ` · ${m.field}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {definition.charts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Charts</h4>
          <div className="grid grid-cols-2 gap-2">
            {definition.charts.map((c, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded p-3 text-sm"
              >
                <p className="font-medium text-gray-900">{c.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {c.type} · group by {c.groupBy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
        ✓ AI successfully designed an application definition. Next step: render
        it as a real working app.
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
      {label}
    </span>
  );
}

export default DefinitionPreview;