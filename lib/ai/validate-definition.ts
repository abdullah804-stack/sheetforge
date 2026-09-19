import type { ParsedWorkbook } from "@/lib/parser/csv";

export interface FieldDef {
  name: string;
  label: string;
  type: string;
  required: boolean;
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  visible: boolean;
}

export interface EntityDef {
  name: string;
  singularName: string;
  sourceSheet: string;
  fields: FieldDef[];
}

export interface MetricDef {
  label: string;
  type: string;
  field?: string;
  entity: string;
}

export interface ChartDef {
  label: string;
  type: string;
  entity: string;
  groupBy: string;
  value?: string;
}

export interface ApplicationDefinition {
  applicationType: string;
  applicationName: string;
  primaryEntity: EntityDef;
  supportingEntities: EntityDef[];
  dashboard: { metrics: MetricDef[] };
  charts: ChartDef[];
  confidence: string;
  notes: string;
}

const VALID_FIELD_TYPES = [
  "text",
  "longtext",
  "integer",
  "decimal",
  "currency",
  "boolean",
  "date",
  "datetime",
  "select",
  "email",
  "url",
  "image",
];

const VALID_APP_TYPES = [
  "inventory",
  "customer",
  "employee",
  "expense",
  "order",
  "task",
  "product",
  "generic",
];

export function validateDefinition(
  raw: any,
  workbook: ParsedWorkbook
): ApplicationDefinition {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI response is not an object");
  }

  if (!VALID_APP_TYPES.includes(raw.applicationType)) {
    raw.applicationType = "generic";
  }

  if (typeof raw.applicationName !== "string" || !raw.applicationName.trim()) {
    raw.applicationName = "Untitled Application";
  }

  // Collect all real sheet names + real columns
  const realSheets = new Map<string, Set<string>>();
  for (const sheet of workbook.sheets) {
    realSheets.set(sheet.name, new Set(sheet.headers));
  }

  const allRealColumns = new Set<string>();
  for (const sheet of workbook.sheets) {
    for (const h of sheet.headers) allRealColumns.add(h);
  }

  // Validate primaryEntity
  const primary = raw.primaryEntity;
  if (!primary || typeof primary !== "object") {
    throw new Error("Missing primaryEntity in AI response");
  }

  const sourceSheet = workbook.sheets.find(
    (s) => s.name === primary.sourceSheet
  )?.name;
  if (!sourceSheet) {
    // Fall back to the first sheet
    primary.sourceSheet = workbook.sheets[0].name;
  }

  primary.fields = (primary.fields || []).filter(
    (f: any) =>
      f &&
      typeof f.name === "string" &&
      typeof f.label === "string" &&
      VALID_FIELD_TYPES.includes(f.type)
  );

  // Make sure at least one field exists
  if (primary.fields.length === 0) {
    const sheet = workbook.sheets.find((s) => s.name === primary.sourceSheet)!;
    primary.fields = sheet.columns.slice(0, 8).map((c) => ({
      name: toSnake(c.name),
      label: c.name,
      type: mapDetectedType(c.detectedType),
      required: c.emptyPercent < 5,
      searchable: c.detectedType === "text",
      filterable: c.uniquePercent < 30 && c.detectedType === "text",
      sortable: true,
      visible: true,
    }));
  }

  // Validate supportingEntities
  raw.supportingEntities = (raw.supportingEntities || []).filter(
    (e: any) => e && typeof e.name === "string" && e.sourceSheet
  );

  // Validate metrics
  raw.dashboard = raw.dashboard || { metrics: [] };
  raw.dashboard.metrics = (raw.dashboard.metrics || [])
    .filter((m: any) => m && typeof m.label === "string" && m.entity)
    .slice(0, 4);

  // Validate charts
  raw.charts = (raw.charts || [])
    .filter(
      (c: any) =>
        c && typeof c.label === "string" && c.entity && c.groupBy
    )
    .slice(0, 3);

  if (!["high", "medium", "low"].includes(raw.confidence)) {
    raw.confidence = "medium";
  }

  if (typeof raw.notes !== "string") {
    raw.notes = "";
  }

  return raw as ApplicationDefinition;
}

function toSnake(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/^_|_$/g, "");
}

function mapDetectedType(t: string): string {
  switch (t) {
    case "integer":
      return "integer";
    case "decimal":
      return "decimal";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    case "email":
      return "email";
    case "url":
      return "url";
    case "image":
      return "image";
    default:
      return "text";
  }
}