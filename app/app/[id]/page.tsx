import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RecordsTable from "./RecordsTable";

export default async function AppRuntimePage({
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

  if (!application || application.userId !== user.id) {
    notFound();
  }

  const definition = application.definition as any;

  if (!definition) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block"
          >
            ← Back to dashboard
          </Link>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              This application hasn't been generated yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const entityName = definition.primaryEntity.name;

  const records = await prisma.record.findMany({
    where: { applicationId: application.id, entityName },
    orderBy: { createdAt: "asc" },
  });

  const totalCount = records.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {application.name}
            </h1>
            <p className="text-xs text-gray-500">
              {definition.primaryEntity.name}
            </p>
          </div>
          <Link
            href={`/dashboard/app/${application.id}`}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Edit definition →
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <MetricCard label="Total Records" value={totalCount.toString()} />
          <MetricCard
            label="Fields"
            value={definition.primaryEntity.fields.length.toString()}
          />
          <MetricCard
            label="Status"
            value={application.status}
          />
        </div>

        <RecordsTable
          applicationId={application.id}
          entityName={entityName}
          fields={definition.primaryEntity.fields}
          initialRecords={records.map((r) => ({
            id: r.id,
            data: r.data as Record<string, any>,
          }))}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}