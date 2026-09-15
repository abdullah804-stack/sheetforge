export interface ChartDef {
  label: string;
  type: "bar" | "line" | "pie" | string;
  entity: string;
  groupBy: string;
  value?: string;
}

export interface ChartPoint {
  group: string;
  value: number;
}

/**
 * Groups records by the given field and sums (or counts) the value field.
 * Returns a sorted array ready for rendering.
 */
export function computeChartData(
  records: { id: string; data: Record<string, any> }[],
  chart: ChartDef
): ChartPoint[] {
  const buckets = new Map<string, number>();

  for (const r of records) {
    const groupRaw = r.data[chart.groupBy];
    const group =
      groupRaw === null || groupRaw === undefined || groupRaw === ""
        ? "—"
        : String(groupRaw);

    let add: number;
    if (chart.value) {
      const v = Number(r.data[chart.value]);
      add = isNaN(v) ? 0 : v;
    } else {
      add = 1;
    }

    buckets.set(group, (buckets.get(group) || 0) + add);
  }

  const points: ChartPoint[] = Array.from(buckets.entries()).map(
    ([group, value]) => ({ group, value })
  );

  // Sort:
  // - For line charts, sort by the group key (usually a date) ascending
  // - For bar/pie, sort by value descending
  if (chart.type === "line") {
    points.sort((a, b) => a.group.localeCompare(b.group));
  } else {
    points.sort((a, b) => b.value - a.value);
  }

  // Limit to top 20 groups to keep charts readable
  return points.slice(0, 20);
}