import type { ReactNode } from "react";

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

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Icon({
  size = 16,
  className = "",
  children,
}: {
  size?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SectionHeader({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="text-gray-400 shrink-0">{icon}</Icon>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {children}
      </p>
    </div>
  );
}

const chipClass =
  "inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs text-gray-700";

function sectionDelay(index: number) {
  return { animationDelay: `${Math.min(index * 50, 250)}ms` };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AIReasoning({
  definition,
  workbook,
}: {
  definition: ApplicationDefinition;
  workbook: ParsedWorkbook;
}) {
  const confidence = friendlyConfidence(definition.confidence);
  const isLow = definition.confidence === "low";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white animate-fade-up">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">
          What we understood
        </h3>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${confidence.color}`}
        >
          {isLow ? (
            <Icon size={12} className="shrink-0">
              <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </Icon>
          ) : (
            <Icon size={12} className="shrink-0">
              <path d="M5 13l4 4L19 7" />
            </Icon>
          )}
          {confidence.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {definition.notes && (
          <p
            className="text-sm text-gray-700 leading-relaxed animate-fade-in"
            style={sectionDelay(0)}
          >
            {definition.notes}
          </p>
        )}

        {/* Simple overview */}
        <div className="animate-fade-in" style={sectionDelay(1)}>
          <SectionHeader
            icon={
              <>
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                <path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7L19 15z" />
              </>
            }
          >
            What we're building
          </SectionHeader>
          <p className="text-sm text-gray-700">
            An easy-to-use view for your {definition.primaryEntity.name.toLowerCase()},
            with the ability to search, sort, and edit records.
          </p>
        </div>

        {/* Fields (human-friendly) */}
        <div className="animate-fade-in" style={sectionDelay(2)}>
          <SectionHeader
            icon={
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </>
            }
          >
            Columns we found
          </SectionHeader>
          <div className="flex flex-wrap gap-2">
            {definition.primaryEntity.fields.map((f) => (
              <span key={f.name} className={chipClass}>
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics (human-friendly) */}
        {definition.dashboard.metrics.length > 0 && (
          <div className="animate-fade-in" style={sectionDelay(3)}>
            <SectionHeader
              icon={
                <>
                  <path d="M5 21V11" />
                  <path d="M12 21V3" />
                  <path d="M19 21v-6" />
                </>
              }
            >
              Numbers we'll show
            </SectionHeader>
            <div className="flex flex-wrap gap-2">
              {definition.dashboard.metrics.map((m, i) => (
                <span key={i} className={chipClass}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Charts (human-friendly) */}
        {definition.charts.length > 0 && (
          <div className="animate-fade-in" style={sectionDelay(4)}>
            <SectionHeader
              icon={
                <>
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </>
              }
            >
              Charts we'll show
            </SectionHeader>
            <div className="flex flex-wrap gap-2">
              {definition.charts.map((c, i) => (
                <span key={i} className={chipClass}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Simple compatibility summary */}
        <div
          className="flex items-start gap-2 border border-gray-100 rounded-md p-3 bg-gray-50/50 animate-fade-in"
          style={sectionDelay(5)}
        >
          <Icon size={14} className="text-gray-400 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </Icon>
          <p className="text-xs text-gray-500 leading-relaxed">
            We imported your data.{" "}
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