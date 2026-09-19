import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SettingsPanel from "./SettingsPanel";
import { getUsageSnapshot, isAdmin, FREE_LIMITS } from "@/lib/usage/limits";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      applications: {
        select: { id: true },
      },
    },
  });

  if (!user) redirect("/login");

  const usage = await getUsageSnapshot(user.id);
  const userIsAdmin = isAdmin(user.email);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Dashboard
          </Link>
          <div className="flex-1" />
          <span className="text-xs text-gray-400">Settings</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 pb-16">
        {/* Page header.
            The entrance animation lives here rather than on the wrapper that
            contains SettingsPanel: an animated transform on an ancestor would
            re-anchor the panel's fixed-position delete modal. */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-700">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="21" x2="14" y1="4" y2="4" />
                <line x1="10" x2="3" y1="4" y2="4" />
                <line x1="21" x2="12" y1="12" y2="12" />
                <line x1="8" x2="3" y1="12" y2="12" />
                <line x1="21" x2="16" y1="20" y2="20" />
                <line x1="12" x2="3" y1="20" y2="20" />
                <line x1="14" x2="14" y1="2" y2="6" />
                <line x1="8" x2="8" y1="10" y2="14" />
                <line x1="16" x2="16" y1="18" y2="22" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Account settings
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Update your profile, check your usage, and manage your account.
          </p>
        </div>

        <SettingsPanel
          user={{
            id: user.id,
            email: user.email,
            name: user.name || "",
            createdAt: user.createdAt.toISOString(),
          }}
          applicationCount={user.applications.length}
          usage={usage}
          isAdmin={userIsAdmin}
          limits={FREE_LIMITS}
        />
      </div>
    </div>
  );
}