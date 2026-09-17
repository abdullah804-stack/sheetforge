"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function CustomizePanel({
  application,
  fields: initialFields,
  metrics: initialMetrics,
}: {
  application: ApplicationData;
  fields: FieldDef[];
  metrics: MetricDef[];
}) {
  const router = useRouter();

  const [name, setName] = useState(application.name);
  const [theme, setTheme] = useState(application.theme || "default");
  const [logoUrl, setLogoUrl] = useState(application.logoUrl || "");
  const [fields, setFields] = useState<FieldDef[]>(initialFields);
  const [metrics, setMetrics] = useState<MetricDef[]>(initialMetrics);

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
    JSON.stringify(metrics) !== JSON.stringify(initialMetrics);

  return (
    <div className="space-y-6">
      {/* Branding */}
      <Section title="Branding" description="How your app appears to viewers.">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              App name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Logo
            </label>
            <div className="flex items-center gap-4">
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

              <label className="cursor-pointer text-sm text-black font-medium underline">
                {uploadingLogo ? "Uploading..." : logoUrl ? "Replace" : "Upload"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>

              {logoUrl && (
                <button
                  onClick={() => {
                    setLogoUrl("");
                    setSaved(false);
                  }}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              PNG, JPG, SVG, or WebP. Max 200 KB.
            </p>
          </div>
        </div>
      </Section>

      {/* Theme */}
      <Section title="Theme" description="The color mood of your app.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setSaved(false);
              }}
              className={`text-left border rounded-md p-3 transition ${
                theme === t.id
                  ? "border-black ring-1 ring-black"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: t.swatch }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {t.name}
                </span>
              </div>
              <p className="text-xs text-gray-500">{t.description}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Fields */}
      <Section
        title="Fields"
        description="Which columns appear in the app."
      >
        <div className="space-y-1">
          {fields.map((f) => (
            <label
              key={f.name}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
            >
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

      {/* Metrics */}
      {metrics.length > 0 && (
        <Section
          title="Dashboard metrics"
          description="Which numbers appear at the top of your app."
        >
          <div className="space-y-1">
            {metrics.map((m, i) => (
              <label
                key={i}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
              >
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

      {/* Error / Save bar */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        {saved && !hasChanges && (
          <span className="text-sm text-green-600">✓ Saved</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-black text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}