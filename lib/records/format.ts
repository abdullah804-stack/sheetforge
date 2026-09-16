export function formatValue(value: any, type: string): string {
  if (value === null || value === undefined || value === "") return "";
  switch (type) {
    case "currency": {
      const n = Number(value);
      return isNaN(n) ? String(value) : `$${n.toFixed(2)}`;
    }
    case "date":
    case "datetime":
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    case "boolean": {
      const v = String(value).toLowerCase();
      if (v === "true" || v === "yes") return "Yes";
      if (v === "false" || v === "no") return "No";
      return String(value);
    }
    default:
      return String(value);
  }
}