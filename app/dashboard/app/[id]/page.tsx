"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Application {
  id: string;
  name: string;
  status: string;
  type: string;
  createdAt: string;
}

interface Workbook {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !application) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
        >
          ← Back to dashboard
        </Link>

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
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
              {application.status}
            </span>
          </div>
        </div>

        {workbook ? (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Uploaded Spreadsheet
            </h2>
            <div className="border border-gray-200 rounded p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{workbook.filename}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(workbook.fileSize / 1024).toFixed(1)} KB · {workbook.fileType.toUpperCase()}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                {workbook.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Next step: SheetForge will analyze this spreadsheet and generate your application. (Coming next.)
            </p>
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