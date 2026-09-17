import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SettingsPanel from "./SettingsPanel";

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Dashboard
          </Link>
          <div className="flex-1" />
          <span className="text-xs text-gray-400">Settings</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Account settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your profile and account.
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
        />
      </div>
    </div>
  );
}