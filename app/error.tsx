"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-mono text-gray-400 mb-4">
          Something went wrong
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          We hit an error
        </h1>
        <p className="text-gray-600 mb-8">
          This wasn't supposed to happen. We've logged the problem. Try again,
          or go back to your dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800 transition"
          >
            My dashboard
          </a>
        </div>
      </div>
    </div>
  );
}