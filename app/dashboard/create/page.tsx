"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateAppPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/applications/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create app");
      setLoading(false);
      return;
    }

    const app = await res.json();
    router.push(`/dashboard/app/${app.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
        >
          ← Back to dashboard
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Application
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            Give your application a name. You'll upload a spreadsheet on the next step.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Inventory"
              className="w-full border border-gray-300 text-gray-900 bg-white rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-black"
              required
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}