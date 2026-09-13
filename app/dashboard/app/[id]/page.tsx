import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) redirect("/login");

  const application = await prisma.application.findUnique({
    where: { id },
  });

  // Ownership check
  if (!application || application.userId !== user.id) {
    notFound();
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

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-start mb-6">
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

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Next step: Upload a spreadsheet
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              In the next stage, you'll upload an Excel or CSV file here and SheetForge
              will turn it into a working application.
            </p>
            <button
              disabled
              className="bg-gray-200 text-gray-500 px-4 py-2 rounded cursor-not-allowed"
            >
              Upload Spreadsheet (coming next)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}