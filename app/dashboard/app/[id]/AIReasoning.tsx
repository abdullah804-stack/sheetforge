
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

function friendlyConfidence(c: string): { label: string; color: string } {
  switch (c) {
    case "high":
      return {
        label: "We understood this well",
        color: "bg-green-50 text-green-700",
      };
    case "low":
      return {
        label: "We need your review",
        color: "bg-red-50 text-red-700",
      };
    default:
      return {
        label: "Looks good",
        color: "bg-yellow-50 text-yellow-700",
      };
  }
}

function friendlyMetricType(type: string): string {
  switch (type) {
    case "count":
      return "Total";
    case "sum":
      return "Sum of";
    case "average":
      return "Average of";
    default:
      return type;
  }
}

function friendlyChartType(type: string): string {
  switch (type) {
    case "bar":
      return "Bar chart";
    case "line":
      return "Trend";
    case "pie":
      return "Breakdown";
    default:
      return type;
  }
}

export function AIReasoning({
  definition,
  workbook,
}: {
  definition: ApplicationDefinition;
  workbook: ParsedWorkbook;
}) {
  const confidence = friendlyConfidence(definition.confidence);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          What we understood
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${confidence.color}`}
        >
          ✓ {confidence.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {definition.notes && (
          <p className="text-sm text-gray-700 leading-relaxed">
            {definition.notes}
          </p>
        )}

        {/* Simple overview */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            What we're building
          </p>
          <p className="text-sm text-gray-700">
            An easy-to-use view for your {definition.primaryEntity.name.toLowerCase()},
            with the ability to search, sort, and edit records.
          </p>
        </div>

        {/* Fields (human-friendly) */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Columns we found
          </p>
          <div className="flex flex-wrap gap-2">
            {definition.primaryEntity.fields.map((f) => (
              <span
                key={f.name}
                className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-700 bg-gray-50"
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics (human-friendly) */}
        {definition.dashboard.metrics.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Numbers we'll show
            </p>
            <div className="flex flex-wrap gap-2">
              {definition.dashboard.metrics.map((m, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-700"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Charts (human-friendly) */}
        {definition.charts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Charts we'll show
            </p>
            <div className="flex flex-wrap gap-2">
              {definition.charts.map((c, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-700"
                >
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Simple compatibility summary */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            ✓ We imported your data.
            {" "}
            <span className="text-gray-400">
              Formulas are imported as their final values (no live recalculation).
              VBA/macros aren't supported.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIReasoning;
