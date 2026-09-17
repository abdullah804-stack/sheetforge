"use client";

import { useState, useEffect } from "react";

interface ShareToken {
  id: string;
  token: string;
  role: string;
  url: string;
  createdAt: string;
}

interface Member {
  id: string;
  role: string;
  user: { id: string; email: string; name: string | null };
  createdAt: string;
}

export default function SharePanel({
  applicationId,
}: {
  applicationId: string;
}) {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<"viewer" | "editor" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [applicationId]);

  async function load() {
    const res = await fetch(
      `/api/applications/share-tokens?applicationId=${applicationId}`
    );
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTokens(data.tokens || []);
    setMembers(data.members || []);
    setLoading(false);
  }

  async function createLink(role: "viewer" | "editor") {
    setCreating(role);
    setError("");

    const res = await fetch("/api/applications/share-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, role }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create link");
      setCreating(null);
      return;
    }

    await load();
    setCreating(null);
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this link? Anyone using it will lose access.")) return;

    const res = await fetch("/api/applications/share-token/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: id }),
    });

    if (!res.ok) return;
    await load();
  }

  async function copyLink(token: string, url: string) {
    const fullUrl = `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Invite people to view or edit this app. They'll need a SheetForge
        account to accept.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {/* Create buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => createLink("viewer")}
          disabled={creating !== null}
          className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50 transition disabled:opacity-50"
        >
          {creating === "viewer" ? "Creating..." : "+ Viewer link"}
        </button>
        <button
          onClick={() => createLink("editor")}
          disabled={creating !== null}
          className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50 transition disabled:opacity-50"
        >
          {creating === "editor" ? "Creating..." : "+ Editor link"}
        </button>
      </div>

      {/* Active links */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-gray-400">
          No active links yet.
        </p>
      ) : (
        <div className="space-y-2 mb-6">
          {tokens.map((t) => (
            <div
              key={t.id}
              className="border border-gray-200 rounded-md p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      t.role === "editor"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t.role}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono truncate">
                  {t.url}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyLink(t.token, t.url)}
                  className="text-xs text-gray-700 hover:text-black font-medium"
                >
                  {copied === t.token ? "✓ Copied" : "Copy"}
                </button>
                <button
                  onClick={() => revoke(t.id)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing members */}
      {members.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            People with access
          </p>
          <div className="space-y-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm text-gray-900">
                    {m.user.name || m.user.email}
                  </p>
                  {m.user.name && (
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    m.role === "editor"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}