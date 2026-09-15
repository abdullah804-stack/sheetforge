"use client";

import AIReasoning from "./AIReasoning";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AnalysisResult from "./AnalysisResult";
import DefinitionPreview from "./DefinitionPreview";

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
      if (data.application?.definition) setDefinition(data.application.definition);
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
      setError(data.error || "Analysis failed");
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
      setError(data.error || "Generation failed");
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
      setError(data.error || "Publish failed");
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
      setError(data.error || "Unpublish failed");
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
          <Link href="/dashboard" className="text-sm text-gray-500 mb-6 inline-block">
            ← Back to dashboard
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
        >
          ← Back to dashboard
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {application.name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Created {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                {application.status}
              </span>
              {definition && (
                <Link
                  href={`/app/${application.id}`}
                  className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
                >
                  Open Application →
                </Link>
              )}
            </div>
          </div>

          {/* Publish panel */}
          {definition && (
            <div className="border-t pt-6 mt-2">
              {isPublished ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-sm font-medium text-green-700">
                      Published
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/a/${application.slug}`}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700"
                    />
                    <button
                      onClick={copyLink}
                      className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <a
                      href={`/a/${application.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
                    >
                      Open
                    </a>
                  </div>
                  <button
                    onClick={handleUnpublish}
                    disabled={publishing}
                    className="text-xs text-gray-500 hover:text-red-600 mt-3"
                  >
                    Unpublish
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Share this application
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Anyone with the link can view (read-only).
                    </p>
                  </div>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
                  >
                    {publishing ? "Publishing..." : "Publish"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spreadsheet section */}
        {workbook ? (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Uploaded Spreadsheet
            </h2>

            <div className="border border-gray-200 rounded p-4 flex items-center justify-between mb-6">
              <div>
                <p className="font-medium text-gray-900">{workbook.filename}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(workbook.fileSize / 1024).toFixed(1)} KB ·{" "}
                  {workbook.fileType.toUpperCase()}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                {workbook.status}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

                        {analysis ? (
              <div>
                <AnalysisResult analysis={analysis} />

                <div className="border-t mt-8 pt-6">
                  {definition ? (
                    <div className="space-y-6">
                      <AIReasoning
                        definition={definition}
                        workbook={analysis}
                      />
                      <DefinitionPreview definition={definition} />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-md font-semibold text-gray-900 mb-2">
                        Ready to generate
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        SheetForge will ask AI to design your application based
                        on this data.
                      </p>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                      >
                        {generating
                          ? "AI is designing your app..."
                          : "Generate Application"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "Analyze Spreadsheet"}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Upload your spreadsheet
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Upload an Excel (.xlsx) or CSV (.csv) file to get started.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`block border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
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
                {uploading ? "Uploading..." : "Drop your spreadsheet here"}
              </p>
              <p className="text-gray-400 text-sm">
                or click to select a file
              </p>
              <p className="text-gray-400 text-xs mt-3">
                Excel (.xlsx) or CSV (.csv) · Max 25 MB
              </p>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}