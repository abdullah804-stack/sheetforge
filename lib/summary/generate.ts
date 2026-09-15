interface FieldDef {
  name: string;
  label: string;
  type: string;
}

interface EntityDef {
  name: string;
  singularName: string;
  sourceSheet: string;
  fields: FieldDef[];
}

interface Record_ {
  id: string;
  data: Record<string, any>;
}

/**
 * Generates a plain-English summary of the dataset.
 * All numbers come from the actual records — no AI involved.
 */
export function generateSummary(
  records: Record_[],
  entity: EntityDef,
  applicationName: string
): string[] {
  if (records.length === 0) {
    return [`This is an empty ${entity.singularName.toLowerCase()} dataset.`];
  }

  const sentences: string[] = [];
  const singular = entity.singularName.toLowerCase();
  const plural = singular + "s";

  // --- Sentence 1: What this is + how many ---
  const totalCount = records.length;
  const counts: string[] = [`${totalCount} ${totalCount === 1 ? singular : plural}`];

  // Find a categorical field with a reasonable number of groups
  const categoricalFields = entity.fields.filter((f) => {
    if (f.type !== "text" && f.type !== "select") return false;
    const uniq = countUnique(records, f.name);
    return uniq >= 2 && uniq <= Math.min(20, records.length * 0.5);
  });

  let categoricalSummary = "";
  if (categoricalFields.length > 0) {
    // Pick the one with the highest "business-like" signal
    const best = categoricalFields.reduce((a, b) => {
      const ua = countUnique(records, a.name);
      const ub = countUnique(records, b.name);
      return ua <= ub ? a : b;
    });

    const uniq = countUnique(records, best.name);
    categoricalSummary = ` across ${uniq} ${best.label.toLowerCase()}${
      uniq === 1 ? "" : "s"
    }`;
  }

  sentences.push(
    `This is a ${singular} dataset with ${counts[0]}${categoricalSummary}.`
  );

  // --- Sentence 2: Numeric highlights ---
  const numericFields = entity.fields.filter(
    (f) => f.type === "integer" || f.type === "decimal" || f.type === "currency"
  );

  if (numericFields.length > 0) {
    const parts: string[] = [];

    for (const f of numericFields.slice(0, 2)) {
      const values = records
        .map((r) => Number(r.data[f.name]))
        .filter((n) => !isNaN(n));

      if (values.length === 0) continue;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const sum = values.reduce((a, b) => a + b, 0);

      if (f.type === "currency") {
        parts.push(
          `${f.label} ranges from ${formatCurrency(min)} to ${formatCurrency(max)} (total ${formatCurrency(sum)})`
        );
      } else {
        parts.push(
          `${f.label} ranges from ${formatNumber(min)} to ${formatNumber(max)} (total ${formatNumber(sum)})`
        );
      }
    }

    if (parts.length > 0) {
      sentences.push(parts.join("; ") + ".");
    }
  }

  // --- Sentence 3: Status field distribution ---
  const statusField = entity.fields.find(
    (f) =>
      /status|state|stage/i.test(f.name) &&
      (f.type === "text" || f.type === "select")
  );

  if (statusField) {
    const distribution = computeDistribution(records, statusField.name);
    const top = distribution.slice(0, 3);
    const total = records.length;

    const parts = top.map(([label, count]) => {
      const pct = Math.round((count / total) * 100);
      return `${pct}% ${label}`;
    });

    sentences.push(`Status breakdown: ${parts.join(", ")}.`);
  }

  // --- Sentence 4: Date range ---
  const dateField = entity.fields.find(
    (f) => f.type === "date" || f.type === "datetime"
  );

  if (dateField) {
    const dates = records
      .map((r) => r.data[dateField.name])
      .filter((v) => v !== null && v !== undefined && v !== "")
      .map((v) => new Date(v))
      .filter((d) => !isNaN(d.getTime()));

    if (dates.length > 0) {
      const earliest = new Date(
        Math.min(...dates.map((d) => d.getTime()))
      );
      const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
      sentences.push(
        `${dateField.label} runs from ${formatDate(earliest)} to ${formatDate(
          latest
        )}.`
      );
    }
  }

  return sentences;
}

function countUnique(records: Record_[], field: string): number {
  const set = new Set<string>();
  for (const r of records) {
    const v = r.data[field];
    if (v !== null && v !== undefined && v !== "") set.add(String(v));
  }
  return set.size;
}

function computeDistribution(
  records: Record_[],
  field: string
): [string, number][] {
  const counts = new Map<string, number>();
  for (const r of records) {
    const v = r.data[field];
    if (v === null || v === undefined || v === "") continue;
    const key = String(v);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n % 1 === 0 ? n.toString() : n.toFixed(2);
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}