"use client";

import { useState, useRef, useEffect } from "react";

export default function DownloadButton({
  applicationId,
}: {
  applicationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function handleDownload(format: "csv" | "xlsx") {
    setDownloading(format);
    setOpen(false);

    // Trigger browser download
    const url = `/api/applications/export?applicationId=${applicationId}&format=${format}`;

    // Create a temporary link and click it
    const link = document.createElement("a");
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(null), 1000);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={!!downloading}
        className="text-sm border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
      >
        {downloading ? "Downloading..." : "Download"}
        <span className="ml-1.5 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden">
          <button
            onClick={() => handleDownload("csv")}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Download as CSV
          </button>
          <button
            onClick={() => handleDownload("xlsx")}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
          >
            Download as Excel
          </button>
        </div>
      )}
    </div>
  );
}