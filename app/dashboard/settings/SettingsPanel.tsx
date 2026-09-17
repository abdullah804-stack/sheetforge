"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export default function SettingsPanel({
  user,
  applicationCount,
}: {
  user: UserData;
  applicationCount: number;
}) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileError("");
    setSaved(false);

    const res = await fetch("/api/account/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json();
      setProfileError(data.error || "Save failed");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  async function handleSignOut() {
    await signOut({ redirectTo: "/login" });
  }

  async function handleDelete() {
    if (deleteConfirm !== "DELETE") return;

    setDeleting(true);
    setDeleteError("");

    const res = await fetch("/api/account/delete", {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error || "Delete failed");
      setDeleting(false);
      return;
    }

    // Sign out and redirect
    await signOut({ redirectTo: "/" });
  }

  const nameChanged = name.trim() !== user.name;

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Profile</h2>
        <p className="text-xs text-gray-500 mb-5">
          How your name appears across SheetForge.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
              className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>

          {profileError && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {profileError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !nameChanged}
              className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saved && (
              <span className="text-sm text-green-600">✓ Saved</span>
            )}
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Account</h2>
        <p className="text-xs text-gray-500 mb-5">
          Your account details.
        </p>

        <div className="space-y-3 mb-6">
          <Row label="Email" value={user.email} />
          <Row
            label="Member since"
            value={new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          />
          <Row
            label="Applications"
            value={`${applicationCount} ${
              applicationCount === 1 ? "application" : "applications"
            }`}
          />
        </div>

        <button
          onClick={handleSignOut}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50 transition"
        >
          Sign out
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-lg shadow p-6 border border-red-100">
        <h2 className="text-base font-semibold text-red-700 mb-1">
          Danger zone
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Permanently delete your account and everything in it. This cannot be
          undone.
        </p>

        <button
          onClick={() => {
            setDeleteOpen(true);
            setDeleteConfirm("");
            setDeleteError("");
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
        >
          Delete account
        </button>
      </div>

      {/* Delete modal */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Delete your account?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete your account, all your applications,
              uploaded files, and records. This action cannot be undone.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type <span className="font-mono text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full border border-gray-300 text-gray-900 rounded-md px-3 py-2 mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />

            {deleteError && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== "DELETE"}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}