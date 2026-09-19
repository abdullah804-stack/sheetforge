"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  OPERATORS,
  STYLES,
  ConditionalRule,
  RuleOperator,
  RuleStyle,
} from "@/lib/conditional/rules";

interface FieldDef {
  name: string;
  label: string;
  type: string;
  visible: boolean;
}

interface MetricDef {
  label: string;
  type: string;
  field?: string;
  entity: string;
}

interface ApplicationData {
  id: string;
  name: string;
  theme: string;
  logoUrl: string | null;
}

const THEMES = [
  {
    id: "default",
    name: "Default",
    description: "Black and white — clean and neutral.",
    swatch: "#0a0a0a",
  },
  {
    id: "warm",
    name: "Warm",
    description: "Amber accents — friendly and energetic.",
    swatch: "#d97706",
  },
  {
    id: "cool",
    name: "Cool",
    description: "Blue accents — calm and professional.",
    swatch: "#2563eb",
  },
];

const controlClass =
  "w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors";

const ruleLabelClass =
  "block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1";

const rowClass =
  "flex items-center gap-3 py-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors";

export default function CustomizePanel({
  application,
  fields: initialFields,
  metrics: initialMetrics,
  initialRules,
}: {
  application: ApplicationData;
  fields: FieldDef[];
  metrics: MetricDef[];
  initialRules: ConditionalRule[];
}) {
  const router = useRouter();

  const [name, setName] = useState(application.name);
  const [theme, setTheme] = useState(application.theme || "default");
  const [logoUrl, setLogoUrl] = useState(application.logoUrl || "");
  const [fields, setFields] = useState<FieldDef[]>(initialFields);
  const [metrics, setMetrics] = useState<MetricDef[]>(initialMetrics);
  const [rules, setRules] = useState<ConditionalRule[]>(initialRules);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  function toggleField(name: string) {
    setFields(
      fields.map((f) =>
        f.name === name ? { ...f, visible: !f.visible } : f
      )
    );
    setSaved(false);
  }

  function toggleMetric(index: number) {
    // Metrics don't have a stable id — we use the label as key
    setMetrics(
      metrics.map((m, i) =>
        i === index ? { ...m, entity: m.entity === "__hidden" ? "" : "__hidden" } : m
      )
    );
    setSaved(false);
  }

  function addRule() {
    const firstField = fields[0]?.name || "";
    setRules([
      ...rules,
      {
        id: `rule_${Date.now()}`,
        field: firstField,
        operator: "lt",
        value: "",
        style: "red",
      },
    ]);
    setSaved(false);
  }

  function updateRule(id: string, patch: Partial<ConditionalRule>) {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  function removeRule(id: string) {
    setRules(rules.filter((r) => r.id !== id));
    setSaved(false);
  }

  function isMetricHidden(m: MetricDef): boolean {
    return m.entity === "__hidden";
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("applicationId", application.id);

    const res = await fetch("/api/applications/upload-logo", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Logo upload failed");
      setUploadingLogo(false);
      return;
    }

    const data = await res.json();
    setLogoUrl(data.logoUrl);
    setUploadingLogo(false);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const visibleFields = fields.map((f) => ({
      name: f.name,
      visible: f.visible,
    }));

    const activeMetrics = metrics.filter((m) => !isMetricHidden(m));
    const removeLogo = !logoUrl && !!application.logoUrl;

    const res = await fetch("/api/applications/update-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: application.id,
        name,
        theme,
        visibleFields,
        activeMetrics,
        removeLogo,
        conditionalRules: rules,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Save failed");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const hasChanges =
    name !== application.name ||
    theme !== application.theme ||
    logoUrl !== (application.logoUrl || "") ||
    JSON.stringify(fields) !== JSON.stringify(initialFields) ||
    JSON.stringify(metrics) !== JSON.stringify(initialMetrics) ||
    JSON.stringify(rules) !== JSON.stringify(initialRules);

  return (
    <div className="space-y-6 pb-24">
      {/* Branding */}
      <Section
        index={0}
        icon={
          <>
            <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3c2 0 3.7-1.6 3.7-3.7C21 6.6 17 3 12 3z" />
            <circle cx="7.5" cy="11" r="0.75" />
            <circle cx="10" cy="7.5" r="0.75" />
            <circle cx="14.5" cy="7.5" r="0.75" />
          </>
        }
        title="Branding"
        description="How your app appears to viewers."
      >
        <div className="space-y-4">
          <Input
            label="App name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Logo
            </span>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-12 w-12 object-contain border border-gray-200 rounded-md p-1 bg-white"
                />
              ) : (
                <div className="h-12 w-12 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                  none
                </div>
              )}

              <label
                className={`inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-2 ${
                  uploadingLogo ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {uploadingLogo ? "Uploading..." : logoUrl ? "Replace" : "Upload"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="sr-only"
                  disabled={uploadingLogo}
                />
              </label>

              {logoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogoUrl("");
                    setSaved(false);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              PNG, JPG, SVG, or WebP. Max 200 KB.
            </p>
          </div>
        </div>
      </Section>

      {/* Theme */}
      <Section
        index={1}
        icon={
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
          </>
        }
        title="Theme"
        description="The color mood of your app."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={theme === t.id}
              onClick={() => {
                setTheme(t.id);
                setSaved(false);
              }}
              className={`text-left border rounded-lg p-3 transition-all duration-200 ${
                theme === t.id
                  ? "border-black ring-1 ring-black"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {/* Mini preview */}
              <div className="h-[60px] rounded-md bg-white border border-gray-200 flex overflow-hidden mb-3">
                <div
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: t.swatch }}
                />
                <div className="flex-1 flex flex-col justify-center gap-1.5 px-2.5">
                  <div className="h-1.5 w-3/4 rounded-full bg-gray-200" />
                  <div className="h-1.5 w-1/2 rounded-full bg-gray-200" />
                  <div className="h-1.5 w-2/3 rounded-full bg-gray-200" />
                </div>
              </div>

              <p className="text-sm font-medium text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Fields */}
      <Section
        index={2}
        icon={
          <>
            <path d="M8 6h13" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M3 6h.01" />
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
          </>
        }
        title="Fields"
        description="Which columns appear in the app."
      >
        <div className="space-y-1">
          {fields.map((f) => (
            <label key={f.name} className={rowClass}>
              <input
                type="checkbox"
                checked={f.visible}
                onChange={() => toggleField(f.name)}
                className="w-4 h-4 accent-black"
              />
              <span className="text-sm text-gray-900">{f.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Conditional rules */}
      <Section
        index={3}
        icon={<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />}
        title="Conditional formatting"
        description="Change how values look based on their content. Example: red when stock is below 10."
      >
        {rules.length === 0 && (
          <p className="text-sm text-gray-400 mb-3">No rules yet.</p>
        )}

        <div className="space-y-3 mb-4">
          {rules.map((rule, i) => (
            <div
              key={rule.id}
              className="border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">
                  Rule {i + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(rule.id)}
                  className="text-red-600! hover:text-red-700! hover:bg-red-50!"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Field */}
                <div>
                  <label htmlFor={`${rule.id}-field`} className={ruleLabelClass}>
                    When
                  </label>
                  <select
                    id={`${rule.id}-field`}
                    value={rule.field}
                    onChange={(e) =>
                      updateRule(rule.id, { field: e.target.value })
                    }
                    className={controlClass}
                  >
                    {fields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div>
                  <label
                    htmlFor={`${rule.id}-operator`}
                    className={ruleLabelClass}
                  >
                    Condition
                  </label>
                  <select
                    id={`${rule.id}-operator`}
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        operator: e.target.value as RuleOperator,
                      })
                    }
                    className={controlClass}
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label htmlFor={`${rule.id}-value`} className={ruleLabelClass}>
                    Value
                  </label>
                  <input
                    id={`${rule.id}-value`}
                    type="text"
                    value={rule.value}
                    onChange={(e) =>
                      updateRule(rule.id, { value: e.target.value })
                    }
                    placeholder="e.g. 10"
                    className={controlClass}
                  />
                </div>

                {/* Second value (only for between) */}
                {rule.operator === "between" && (
                  <div>
                    <label
                      htmlFor={`${rule.id}-value2`}
                      className={ruleLabelClass}
                    >
                      and
                    </label>
                    <input
                      id={`${rule.id}-value2`}
                      type="text"
                      value={rule.value2 ?? ""}
                      onChange={(e) =>
                        updateRule(rule.id, { value2: e.target.value })
                      }
                      placeholder="e.g. 50"
                      className={controlClass}
                    />
                  </div>
                )}

                {/* Style */}
                <div>
                  <label htmlFor={`${rule.id}-style`} className={ruleLabelClass}>
                    Then show
                  </label>
                  <select
                    id={`${rule.id}-style`}
                    value={rule.style}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        style: e.target.value as RuleStyle,
                      })
                    }
                    className={controlClass}
                  >
                    {STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={addRule}>
          + Add rule
        </Button>
      </Section>

      {/* Metrics */}
      {metrics.length > 0 && (
        <Section
          index={4}
          icon={
            <>
              <path d="M5 21V11" />
              <path d="M12 21V3" />
              <path d="M19 21v-6" />
            </>
          }
          title="Dashboard metrics"
          description="Which numbers appear at the top of your app."
        >
          <div className="space-y-1">
            {metrics.map((m, i) => (
              <label key={i} className={rowClass}>
                <input
                  type="checkbox"
                  checked={!isMetricHidden(m)}
                  onChange={() => toggleMetric(i)}
                  className="w-4 h-4 accent-black"
                />
                <span className="text-sm text-gray-900">{m.label}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 py-4 px-6">
        <div className="max-w-3xl mx-auto flex justify-end items-center gap-3">
          {error && (
            <div className="mr-auto bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          {saved && !hasChanges && (
            <span className="text-sm text-green-600 animate-fade-in">
              ✓ Saved
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            className="transition-all!"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  index,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-lg shadow p-6 animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500 shrink-0"
            aria-hidden="true"
          >
            {icon}
          </svg>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}