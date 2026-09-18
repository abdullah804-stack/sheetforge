interface FieldDef {
  name: string;
  label: string;
  type: string;
}

interface Record_ {
  id: string;
  data: Record<string, any>;
}

/**
 * Builds a compact, human-readable description of the current dataset
 * to give the AI enough context to answer questions accurately.
 *
 * The AI sees:
 *   - Column names + types
 *   - Row count
 *   - Statistics for numeric columns
 *   - Top 10 unique values per categorical column
 *   - First 5 sample rows
 *
 * Nothing else. No raw data dump.
 */
export function buildChatContext(
  records: Record_[],
  fields: FieldDef[],
  appName: string
): string {
  const lines: string[] = [];

  lines.push(`Dataset: ${appName}`);
  lines.push(`Total records: ${records.length}`);
  lines.push("");
  lines.push("Columns:");

  for (const f of fields) {
    const values = records
      .map((r) => r.data[f.name])
      .filter((v) => v !== null && v !== undefined && v !== "");

    lines.push(`- ${f.label} (${f.name}) — type: ${f.type}`);

    if (
      f.type === "integer" ||
      f.type === "decimal" ||
      f.type === "currency"
    ) {
      const nums = values.map((v) => Number(v)).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const avg = sum / nums.length;

        lines.push(
          `    count=${nums.length}, sum=${format(sum, f.type)}, min=${format(
            min,
            f.type
          )}, max=${format(max, f.type)}, avg=${format(avg, f.type)}`
        );
      }
    } else if (f.type === "text" || f.type === "select") {
      const uniq = Array.from(new Set(values.map(String)));
      const top = uniq.slice(0, 10);

      if (uniq.length <= 20) {
        // Show the actual value distribution
        const counts = new Map<string, number>();
        for (const v of values) {
          const k = String(v);
          counts.set(k, (counts.get(k) || 0) + 1);
        }
        const sorted = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([k, c]) => `${k} (${c})`);
        lines.push(`    values: ${sorted.join(", ")}`);
      } else {
        lines.push(
          `    unique values: ${uniq.length}, samples: ${top
            .slice(0, 5)
            .join(", ")}`
        );
      }
    } else if (f.type === "date" || f.type === "datetime") {
      const dates = values
        .map((v) => new Date(v))
        .filter((d) => !isNaN(d.getTime()));
      if (dates.length > 0) {
        const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
        const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
        lines.push(
          `    range: ${earliest.toISOString().slice(0, 10)} to ${latest
            .toISOString()
            .slice(0, 10)}`
        );
      }
    } else if (f.type === "boolean") {
      const trues = values.filter((v) =>
        /^(true|yes|1)$/i.test(String(v))
      ).length;
      lines.push(`    true: ${trues}, false: ${values.length - trues}`);
    }
  }

  lines.push("");
  lines.push("Sample records (first 5):");
  for (const r of records.slice(0, 5)) {
    const obj: Record<string, any> = {};
    for (const f of fields) {
      obj[f.name] = r.data[f.name];
    }
    lines.push(JSON.stringify(obj));
  }

  return lines.join("\n");
}

function format(n: number, type: string): string {
  const rounded = Math.round(n * 100) / 100;
  if (type === "currency") return `$${rounded}`;
  return String(rounded);
}