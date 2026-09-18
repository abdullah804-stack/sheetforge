export type RuleOperator =
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "eq"
  | "neq"
  | "contains"
  | "between";

export type RuleStyle =
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "gray"
  | "red-text"
  | "green-text"
  | "bold";

export interface ConditionalRule {
  id: string;
  field: string;
  operator: RuleOperator;
  value: string | number;
  value2?: string | number;
  style: RuleStyle;
}

export const OPERATORS: { id: RuleOperator; label: string }[] = [
  { id: "lt", label: "is less than" },
  { id: "lte", label: "is less than or equal to" },
  { id: "gt", label: "is greater than" },
  { id: "gte", label: "is greater than or equal to" },
  { id: "eq", label: "equals" },
  { id: "neq", label: "does not equal" },
  { id: "contains", label: "contains" },
  { id: "between", label: "is between" },
];

export const STYLES: { id: RuleStyle; label: string }[] = [
  { id: "red", label: "Red background" },
  { id: "yellow", label: "Yellow background" },
  { id: "green", label: "Green background" },
  { id: "blue", label: "Blue background" },
  { id: "gray", label: "Gray background" },
  { id: "red-text", label: "Red text" },
  { id: "green-text", label: "Green text" },
  { id: "bold", label: "Bold text" },
];

/* ------------------------------------------------------------------ */
/* Evaluate whether a rule matches the given cell value                */
/* ------------------------------------------------------------------ */

export function ruleMatches(
  rule: ConditionalRule,
  cellValue: any
): boolean {
  if (cellValue === null || cellValue === undefined || cellValue === "") {
    return false;
  }

  const num = Number(cellValue);
  const ruleNum = Number(rule.value);
  const ruleNum2 = rule.value2 !== undefined ? Number(rule.value2) : undefined;

  switch (rule.operator) {
    case "lt":
      return !isNaN(num) && !isNaN(ruleNum) && num < ruleNum;
    case "lte":
      return !isNaN(num) && !isNaN(ruleNum) && num <= ruleNum;
    case "gt":
      return !isNaN(num) && !isNaN(ruleNum) && num > ruleNum;
    case "gte":
      return !isNaN(num) && !isNaN(ruleNum) && num >= ruleNum;
    case "eq":
      return String(cellValue).toLowerCase() === String(rule.value).toLowerCase();
    case "neq":
      return String(cellValue).toLowerCase() !== String(rule.value).toLowerCase();
    case "contains":
      return String(cellValue)
        .toLowerCase()
        .includes(String(rule.value).toLowerCase());
    case "between":
      return (
        !isNaN(num) &&
        !isNaN(ruleNum) &&
        ruleNum2 !== undefined &&
        !isNaN(ruleNum2) &&
        num >= ruleNum &&
        num <= ruleNum2
      );
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ */
/* Find the first matching rule for a field + value                    */
/* ------------------------------------------------------------------ */

export function styleForValue(
  rules: ConditionalRule[] | undefined,
  fieldName: string,
  cellValue: any
): RuleStyle | null {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    if (rule.field !== fieldName) continue;
    if (ruleMatches(rule, cellValue)) return rule.style;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Convert a style ID into Tailwind classes                            */
/* ------------------------------------------------------------------ */

export function styleClasses(style: RuleStyle | null): string {
  if (!style) return "";

  switch (style) {
    case "red":
      return "bg-red-50 text-red-700";
    case "yellow":
      return "bg-yellow-50 text-yellow-800";
    case "green":
      return "bg-green-50 text-green-700";
    case "blue":
      return "bg-blue-50 text-blue-700";
    case "gray":
      return "bg-gray-100 text-gray-700";
    case "red-text":
      return "text-red-600 font-medium";
    case "green-text":
      return "text-green-600 font-medium";
    case "bold":
      return "font-semibold";
    default:
      return "";
  }
}