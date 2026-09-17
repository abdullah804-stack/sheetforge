"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JoinClient({
  token,
  appName,
  theme,
  logoUrl,
  role,
  applicationId,
  isSignedIn,
  isOwner,
  alreadyMember,
}: {
  token: string;
  appName: string;
  theme: string;
  logoUrl: string | null;
  role: string;
  applicationId: string;
  isSignedIn: boolean;
  isOwner: boolean;
  alreadyMember: boolean;
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setAccepting(true);
    setError("");

    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to accept invite");
      setAccepting(false);
      return;
    }

    // Redirect to the app
    router.push(`/app/${applicationId}`);
  }

  const roleLabel = role === "editor" ? "edit" : "view";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        {/* Logo */}
        {logoUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={logoUrl}
              alt=""
              className="h-12 w-12 object-contain rounded"
            />
          </div>
        )}

        {isOwner ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              You already own this app
            </h1>
            <p className="text-sm text-gray-500 mb-6 text-center">
              This is your own app, so you don't need to accept this invite.
            </p>
            <Link
              href={`/app/${applicationId}`}
              className="block w-full text-center bg-black text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition"
            >
              Open app →
            </Link>
          </>
        ) : alreadyMember ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              You already have access
            </h1>
            <p className="text-sm text-gray-500 mb-6 text-center">
              You're already a member of this app.
            </p>
            <Link
              href={`/app/${applicationId}`}
              className="block w-full text-center bg-black text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition"
            >
              Open app →
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              You've been invited
            </h1>
            <p className="text-sm text-gray-500 mb-6 text-center">
              You're invited to {roleLabel} <strong>{appName}</strong>.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-md p-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">Your access</p>
              <p className="text-sm text-gray-900 font-medium capitalize">
                {role}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            {!isSignedIn ? (
              <>
                <p className="text-xs text-gray-500 mb-4 text-center">
                  Sign in or create an account to accept this invite.
                </p>
                <div className="space-y-2">
                  <Link
                    href={`/signup?redirect=${encodeURIComponent(
                      `/join/${token}`
                    )}`}
                    className="block w-full text-center bg-black text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Create an account
                  </Link>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(
                      `/join/${token}`
                    )}`}
                    className="block w-full text-center border border-gray-300 text-gray-700 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 transition"
                  >
                    I already have an account
                  </Link>
                </div>
              </>
            ) : (
              <button
                onClick={accept}
                disabled={accepting}
                className="w-full bg-black text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
              >
                {accepting ? "Accepting..." : `Accept & ${roleLabel} app`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}