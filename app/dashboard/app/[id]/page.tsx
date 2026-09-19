"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import AIReasoning from "./AIReasoning";
import SharePanel from "./SharePanel";

interface Application {
  id: string;
  name: string;
  status: string;
  type: string;
  createdAt: string;
  slug?: string | null;
  visibility?: string;
  publishedAt?: string | null;
  definition?: any;
  theme?: string;
  logoUrl?: string | null;
}

interface Workbook {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
  parsedData?: any;
}

type StatusIconKind = "check" | "dot" | "circle" | "alert";

/**
 * Friendly status labels.
 */
function friendlyStatus(s: string): {
  label: string;
  color: string;
  icon: StatusIconKind;
} {
  switch (s) {
    case "DRAFT":
      return {
        label: "Not started",
        color: "bg-gray-100 text-gray-600",
        icon: "circle",
      };
    case "UPLOADED":
      return {
        label: "File uploaded",
        color: "bg-gray-100 text-gray-600",
        icon: "dot",
      };
    case "PARSED":
      return {
        label: "File read",
        color: "bg-blue-50 text-blue-700",
        icon: "dot",
      };
    case "GENERATED":
      return {
        label: "Built",
        color: "bg-blue-50 text-blue-700",
        icon: "dot",
      };
    case "READY":
      return {
        label: "Ready to use",
        color: "bg-green-50 text-green-700",
        icon: "check",
      };
    case "PUBLISHED":
      return {
        label: "Published",
        color: "bg-green-50 text-green-700",
        icon: "check",
      };
    case "PARSE_FAILED":
      return {
        label: "Could not read file",
        color: "bg-red-50 text-red-700",
        icon: "alert",
      };
    default:
      return { label: s, color: "bg-gray-100 text-gray-600", icon: "dot" };
  }
}

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [definition, setDefinition] = useState<any>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/applications/get?id=${id}`);
      if (!res.ok) {
        setError("Application not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setApplication(data.application);
      setWorkbook(data.workbook);
      if (data.workbook?.parsedData) setAnalysis(data.workbook.parsedData);
      if (data.application?.definition)
        setDefinition(data.application.definition);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("applicationId", id);

    const res = await fetch("/api/applications/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Upload failed");
      setUploading(false);
      return;
    }

    const wb = await res.json();
    setWorkbook(wb);
    setUploading(false);
    router.refresh();
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleAnalyze() {
    if (!workbook) return;
    setAnalyzing(true);
    setError("");
    const res = await fetch("/api/applications/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workbookId: workbook.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not read the file");
      setAnalyzing(false);
      return;
    }
    const result = await res.json();
    setAnalysis(result);
    setAnalyzing(false);
  }

  async function handleGenerate() {
    if (!workbook) return;
    setGenerating(true);
    setError("");
    const res = await fetch("/api/applications/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workbookId: workbook.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not build the app");
      setGenerating(false);
      return;
    }
    const result = await res.json();
    setDefinition(result.definition);
    setGenerating(false);
    const refreshed = await fetch(`/api/applications/get?id=${id}`).then((r) =>
      r.json()
    );
    setApplication(refreshed.application);
  }

  async function handlePublish() {
    if (!application) return;
    setPublishing(true);
    setError("");

    const res = await fetch("/api/applications/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: application.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not publish");
      setPublishing(false);
      return;
    }

    const data = await res.json();
    setApplication({ ...application, slug: data.slug, visibility: "PUBLIC" });
    setPublishing(false);
  }

  async function handleUnpublish() {
    if (!application) return;
    setPublishing(true);
    setError("");

    const res = await fetch("/api/applications/unpublish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: application.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not unpublish");
      setPublishing(false);
      return;
    }

    setApplication({ ...application, slug: null, visibility: "PRIVATE" });
    setPublishing(false);
  }

  async function copyLink() {
    if (!application?.slug) return;
    const url = `${window.location.origin}/a/${application.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 mb-6 inline-block"
          >
            ← Back
          </Link>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600">{error || "Application not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const isPublished =
    application.visibility === "PUBLIC" && !!application.slug;
  const status = friendlyStatus(application.status);
  const hasFile = !!workbook;
  const hasAnalysis = !!analysis;
  const hasDefinition = !!definition;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
        >
          ← Back
        </Link>

        {/* ============================================ */}
        {/* BLOCK 1 — Header + Actions                   */}
        {/* ============================================ */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {application.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${status.color}`}
                >
                  <StatusIcon kind={status.icon} />
                  {status.label}
                </span>
                <span className="text-xs text-gray-400">
                  Created{" "}
                  {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Primary actions — only show what's available */}
          <div className="flex flex-wrap items-center gap-2">
            {hasDefinition && (
              <>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push(`/app/${application.id}`)}
                >
                  Open app →
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() =>
                    router.push(`/dashboard/app/${application.id}/customize`)
                  }
                >
                  Customize
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    window.location.href = `/api/applications/export?applicationId=${application.id}&format=csv`;
                  }}
                >
                  Download
                </Button>
                {!isPublished ? (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handlePublish}
                    loading={publishing}
                  >
                    {publishing ? "Publishing..." : "Share"}
                  </Button>
                ) : (
                  <Button variant="secondary" size="md" onClick={copyLink}>
                    {copied ? "✓ Link copied" : "Copy share link"}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Publish info — only when published */}
          {isPublished && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Public link</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/a/${application.slug}`}
                  className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-xs bg-gray-50 text-gray-600"
                />
                <a
                  href={`/a/${application.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-gray-900 underline"
                >
                  Open
                </a>
                <button
                  onClick={handleUnpublish}
                  disabled={publishing}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Unpublish
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* Team sharing (only after app is built)       */}
        {/* ============================================ */}
        {hasDefinition && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Share with your team
            </h2>
            <SharePanel applicationId={application.id} />
          </div>
        )}

        {/* ============================================ */}
        {/* BLOCK 2 — File + Progress                    */}
        {/* ============================================ */}
        <div
          className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-up"
          style={{ animationDelay: "50ms" }}
        >
          {!hasFile ? (
            <>
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                Add your first file
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Upload an Excel or CSV file. We'll show you what's inside.
              </p>

              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`block border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition ${
                  dragging
                    ? "border-black bg-gray-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <p className="text-gray-700 font-medium mb-1">
                  {uploading ? "Uploading..." : "Drop your file here"}
                </p>
                <p className="text-gray-400 text-sm">
                  or click to choose a file
                </p>
                <p className="text-gray-400 text-xs mt-3">
                  Excel (.xlsx) or CSV (.csv) · Max 25 MB
                </p>
              </label>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {workbook.filename}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(workbook.fileSize / 1024).toFixed(1)} KB ·{" "}
                    {workbook.fileType.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Progress timeline */}
              <div>
                <ProgressStep done label="File uploaded" />
                <ProgressStep
                  done={hasAnalysis}
                  active={!hasAnalysis && !analyzing}
                  label="We look inside"
                  action={
                    !hasAnalysis && !analyzing ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="-my-1"
                        onClick={handleAnalyze}
                      >
                        Read it now
                      </Button>
                    ) : !hasAnalysis && analyzing ? (
                      <span className="text-xs text-gray-400">Reading...</span>
                    ) : null
                  }
                />
                <ProgressStep
                  done={hasDefinition}
                  active={hasAnalysis && !hasDefinition && !generating}
                  label="We build your app"
                  action={
                    hasAnalysis && !hasDefinition && !generating ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="-my-1"
                        onClick={handleGenerate}
                      >
                        Build it now
                      </Button>
                    ) : hasAnalysis && !hasDefinition && generating ? (
                      <span className="text-xs text-gray-400">Building...</span>
                    ) : null
                  }
                />
                <ProgressStep done={hasDefinition} label="Ready to use" last />
              </div>

              {/* Preview toggle — small, quiet */}
              {hasAnalysis && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                  >
                    {showPreview ? "Hide" : "See a preview of your file"}
                    <span className="text-[10px]">
                      {showPreview ? "▲" : "▼"}
                    </span>
                  </button>

                  {showPreview && (
                    <div className="mt-4">
                      <CompactPreview analysis={analysis} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ============================================ */}
        {/* BLOCK 3 — What we understood                 */}
        {/* ============================================ */}
        {hasDefinition && (
          <AIReasoning definition={definition} workbook={analysis} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatusIcon({ kind }: { kind: StatusIconKind }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "check" && <path d="M5 13l4 4L19 7" />}
      {kind === "dot" && (
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      )}
      {kind === "circle" && <circle cx="12" cy="12" r="7" />}
      {kind === "alert" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </>
      )}
    </svg>
  );
}

function ProgressStep({
  done,
  active,
  label,
  action,
  last,
}: {
  done: boolean;
  active?: boolean;
  label: string;
  action?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Indicator + connector */}
      <div className="flex flex-col items-center">
        <div
          className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
            done
              ? "bg-green-100 text-green-700"
              : active
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-400"
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {done ? (
              <path d="M5 13l4 4L19 7" />
            ) : active ? (
              <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
            ) : (
              <circle cx="12" cy="12" r="4" strokeWidth="2" />
            )}
          </svg>
        </div>
        {!last && (
          <div
            className={`w-px flex-1 min-h-3 my-1 transition-colors duration-300 ${
              done ? "bg-green-200" : "bg-transparent"
            }`}
          />
        )}
      </div>

      {/* Label + action */}
      <div className="flex-1 min-w-0 flex items-start justify-between gap-3 text-sm">
        <span
          className={`h-6 flex items-center ${
            done
              ? "text-gray-900 font-medium"
              : active
                ? "text-gray-700"
                : "text-gray-400"
          }`}
        >
          {label}
        </span>
        {action && <div className="h-6 flex items-center">{action}</div>}
      </div>
    </div>
  );
}

function CompactPreview({ analysis }: { analysis: any }) {
  const sheet = analysis.sheets[0];
  if (!sheet) return null;

  return (
    <div>
      <div className="text-xs text-gray-500 mb-3">
        {sheet.rowCount} {sheet.rowCount === 1 ? "record" : "records"} ·{" "}
        {sheet.columnCount} {sheet.columnCount === 1 ? "column" : "columns"}
      </div>

      <div className="border border-gray-200 rounded overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {sheet.headers.map((h: string) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sheet.sampleRows.slice(0, 3).map((row: any, i: number) => (
              <tr key={i}>
                {sheet.headers.map((h: string) => (
                  <td
                    key={h}
                    className="px-3 py-2 text-gray-700 whitespace-nowrap"
                  >
                    {row[h] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sheet.rowCount > 3 && (
        <p className="text-[11px] text-gray-400 mt-2">
          + {sheet.rowCount - 3} more{" "}
          {sheet.rowCount - 3 === 1 ? "row" : "rows"}
        </p>
      )}
    </div>
  );
}