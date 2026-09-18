import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CustomizePanel from "./CustomizePanel";

export default async function CustomizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/login");

  const application = await prisma.application.findUnique({
    where: { id },
  });
  if (!application || application.userId !== user.id) notFound();

  const definition = application.definition as any;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href={`/dashboard/app/${application.id}`}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back
          </Link>
          <div className="flex-1" />
          <span className="text-xs text-gray-400">Customize</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Customize your app
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Make this app feel like your own.
          </p>
        </div>

                <CustomizePanel
          application={{
            id: application.id,
            name: application.name,
            theme: application.theme,
            logoUrl: application.logoUrl,
          }}
          fields={definition?.primaryEntity?.fields || []}
          metrics={definition?.dashboard?.metrics || []}
          initialRules={definition?.conditionalRules || []}
        />
      </div>
    </div>
  );
}