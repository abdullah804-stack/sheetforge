export type AggregateType =
  | "count"
  | "sum"
  | "average"
  | "min"
  | "max";

export interface PivotConfig {
  groupBy: string;         // field name
  aggregate: AggregateType;
  valueField?: string;     // field name (required for sum/avg/min/max)
  groupBy2?: string;       // optional second breakdown
}

export interface PivotRow {
  group: string;
  value: number;
  subGroups?: Record<string, number>;
}

export interface PivotResult {
  rows: PivotRow[];
  subGroupKeys: string[];
  total: number;
  aggregateLabel: string;
}

interface Record_ {
  id: string;
  data: Record<string, any>;
}

/**
 * Computes a pivot table from a set of records and a config.
 */
export function computePivot(
  records: Record_[],
  config: PivotConfig
): PivotResult {
  const { groupBy, aggregate, valueField, groupBy2 } = config;

  // Bucket rows by group value
  const buckets = new Map<string, Record_[]>();

  for (const r of records) {
    const g = r.data[groupBy];
    const key =
      g === null || g === undefined || g === "" ? "(blank)" : String(g);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  // If second grouping is set, gather all sub-group keys first
  const subGroupKeys = new Set<string>();
  if (groupBy2) {
    for (const r of records) {
      const s = r.data[groupBy2];
      const key =
        s === null || s === undefined || s === "" ? "(blank)" : String(s);
      subGroupKeys.add(key);
    }
  }

  const rows: PivotRow[] = [];

  for (const [group, rs] of buckets.entries()) {
    let value = aggregateRecords(rs, aggregate, valueField);

    let subGroups: Record<string, number> | undefined;
    if (groupBy2) {
      subGroups = {};
      const subBuckets = new Map<string, Record_[]>();
      for (const r of rs) {
        const s = r.data[groupBy2];
        const key =
          s === null || s === undefined || s === "" ? "(blank)" : String(s);
        if (!subBuckets.has(key)) subBuckets.set(key, []);
        subBuckets.get(key)!.push(r);
      }
      for (const [subKey, subRs] of subBuckets.entries()) {
        subGroups[subKey] = aggregateRecords(subRs, aggregate, valueField);
      }
    }

    rows.push({ group, value, subGroups });
  }

  // Sort by value descending
  rows.sort((a, b) => b.value - a.value);

  const total = aggregateRecords(records, aggregate, valueField);

  return {
    rows,
    subGroupKeys: Array.from(subGroupKeys).sort(),
    total,
    aggregateLabel: labelForAggregate(aggregate, valueField),
  };
}

function aggregateRecords(
  records: Record_[],
  aggregate: AggregateType,
  valueField?: string
): number {
  if (aggregate === "count") return records.length;

  if (!valueField) return 0;

  const nums = records
    .map((r) => Number(r.data[valueField]))
    .filter((n) => !isNaN(n));

  if (nums.length === 0) return 0;

  switch (aggregate) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "average":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    default:
      return 0;
  }
}

function labelForAggregate(
  aggregate: AggregateType,
  valueField?: string
): string {
  switch (aggregate) {
    case "count":
      return "Count";
    case "sum":
      return `Sum of ${valueField ?? "value"}`;
    case "average":
      return `Average of ${valueField ?? "value"}`;
    case "min":
      return `Min of ${valueField ?? "value"}`;
    case "max":
      return `Max of ${valueField ?? "value"}`;
  }
}

/**
 * Formats a number for display in the pivot table.
 */
export function formatPivotNumber(n: number): string {
  if (n === 0) return "0";
  if (Math.abs(n) >= 1_000_000)
    return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}