"use client";

import { useState, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface UserData {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface Usage {
  apps: { used: number; max: number };
  ai: { used: number; max: number };
  edits: { used: number; max: number };
  recordsPerApp: { max: number };
  fileSize: { max: number };
}

interface Limits {
  maxApps: number;
  maxRecordsPerApp: number;
  maxFileSizeBytes: number;
  maxAiPerMonth: number;
  maxEditsPerMonth: number;
}

// Entrance-animation helper (animation + transition delay, so it works
// whichever the utility class uses).
function stagger(ms: number): CSSProperties {
  return {
    animationDelay: `${ms}ms`,
    transitionDelay: `${ms}ms`,
    animationFillMode: "both",
  };
}

function Icon({
  size = 16,
  className,
  children,
}: {
  size?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className || ""}`}
    >
      {children}
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </Icon>
  );
}

function AlertTriangleIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Icon size={size} className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export default function SettingsPanel({
  user,
  applicationCount,
  usage,
  isAdmin,
  limits,
}: {
  user: UserData;
  applicationCount: number;
  usage: Usage | null;
  isAdmin: boolean;
  limits: Limits;
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
    <div className="space-y-8">
      {/* Profile */}
      <div
        className="bg-white rounded-lg shadow p-6 animate-fade-up"
        style={stagger(50)}
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <UserIcon className="text-gray-400" />
          Profile
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          How your name appears across SheetForge.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Display name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
          />

          {profileError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {profileError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving || !nameChanged}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">✓ Saved</span>
            )}
          </div>
        </form>
      </div>

      {/* Account info */}
      <div
        className="bg-white rounded-lg shadow p-6 animate-fade-up"
        style={stagger(100)}
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <SettingsIcon className="text-gray-400" />
          Account
        </h2>
        <p className="text-xs text-gray-500 mb-5">Your account details.</p>

        <div className="divide-y divide-gray-100 mb-6">
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

        <Button variant="secondary" size="md" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>

      {/* Usage */}
      <div
        className="bg-white rounded-lg shadow p-6 animate-fade-up"
        style={stagger(150)}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <BarChartIcon className="text-gray-400" />
            Usage
          </h2>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${
              isAdmin
                ? "bg-purple-50 text-purple-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isAdmin ? "Admin · unlimited" : "Free plan"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          {isAdmin
            ? "You have unlimited access. Limits don't apply to your account."
            : "What you've used on your current plan."}
        </p>

        {usage && !isAdmin && (
          <div className="space-y-4">
            <UsageRow
              label="Applications"
              used={usage.apps.used}
              max={usage.apps.max}
            />
            <UsageRow
              label="AI generations this month"
              used={usage.ai.used}
              max={usage.ai.max}
            />
            <UsageRow
              label="Manual edits this month"
              used={usage.edits.used}
              max={usage.edits.max}
            />
            <div className="pt-1 border-t border-gray-100 divide-y divide-gray-100">
              <Row
                label="Per app"
                value={`Up to ${usage.recordsPerApp.max.toLocaleString()} records`}
              />
              <Row
                label="File size"
                value={`Up to ${(usage.fileSize.max / 1024 / 1024).toFixed(
                  0
                )} MB`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div
        className="bg-white rounded-lg shadow p-6 border border-red-100 animate-fade-up"
        style={stagger(200)}
      >
        <h2 className="text-base font-semibold text-red-700 mb-1 flex items-center gap-2">
          <AlertTriangleIcon className="text-red-500" />
          Danger zone
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Permanently delete your account and everything in it. This cannot be
          undone.
        </p>

        <Button
          variant="danger"
          size="md"
          onClick={() => {
            setDeleteOpen(true);
            setDeleteConfirm("");
            setDeleteError("");
          }}
        >
          Delete account
        </Button>
      </div>

      {/* Delete modal */}
      {deleteOpen && (
        <div
          className="sf-modal-overlay fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <style>{`
            @keyframes sf-modal-overlay-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes sf-modal-panel-in {
              from { opacity: 0; transform: scale(0.98); }
              to { opacity: 1; transform: scale(1); }
            }
            .sf-modal-overlay { animation: sf-modal-overlay-in 200ms ease-out both; }
            .sf-modal-panel { animation: sf-modal-panel-in 200ms ease-out both; }
            @media (prefers-reduced-motion: reduce) {
              .sf-modal-overlay, .sf-modal-panel { animation: none; }
            }
          `}</style>

          <div className="sf-modal-panel bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="mx-auto mb-4 h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangleIcon size={16} />
            </div>

            <h2
              id="delete-account-title"
              className="text-lg font-semibold text-gray-900 mb-2 text-center"
            >
              Delete your account?
            </h2>
            <p className="text-sm text-gray-500 mb-5 text-center">
              This will permanently delete your account, all your applications,
              uploaded files, and records. This action cannot be undone.
            </p>

            <label
              htmlFor="delete-confirm"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Type{" "}
              <span className="font-mono font-bold text-red-600">DELETE</span>{" "}
              to confirm
            </label>
            <div className="mb-4">
              <Input
                id="delete-confirm"
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== "DELETE"}
              >
                {deleting ? "Deleting..." : "Delete forever"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 items-baseline py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right break-words min-w-0">
        {value}
      </span>
    </div>
  );
}

const TONES = {
  green: { text: "text-green-600", bar: "bg-green-500" },
  yellow: { text: "text-yellow-600", bar: "bg-yellow-500" },
  red: { text: "text-red-600", bar: "bg-red-500" },
} as const;

function UsageRow({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const percent = Math.min(100, Math.round((used / max) * 100));
  const isAtLimit = used >= max;

  // green under 50%, yellow 50–80%, red above 80%
  const tone =
    isAtLimit || percent > 80 ? "red" : percent >= 50 ? "yellow" : "green";
  const colors = TONES[tone];

  // Start the bar at 0 and grow it to its value once mounted.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-700">{label}</span>
        <span className={`font-medium ${colors.text}`}>
          {used} / {max}
        </span>
      </div>
      <div
        className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}