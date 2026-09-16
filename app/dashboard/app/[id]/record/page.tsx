import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatValue } from "@/lib/records/format";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const { id, recordId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/login");

  const application = await prisma.application.findUnique({
    where: { id },
  });
  if (!application || application.userId !== user.id) notFound();

  const definition = application.definition as any;
  if (!definition) notFound();

  const record = await prisma.record.findUnique({
    where: { id: recordId },
  });
  if (!record || record.applicationId !== application.id) notFound();

  const fields = definition.primaryEntity.fields as {
    name: string;
    label: string;
    type: string;
    visible: boolean;
  }[];

  const data = record.data as Record<string, any>;
  const titleField = fields.find((f) =>
    /^(name|title|product|customer|employee|item)$/i.test(f.name)
  );
  const title = titleField ? String(data[titleField.name] ?? "Record") : "Record";

  // Fields to display: everything visible, in order
  const displayFields = fields.filter((f) => f.visible);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href={`/app/${application.id}`}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-xs text-gray-400 mb-1">Record</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>

          <div className="divide-y border-t border-gray-100">
            {displayFields.map((f) => (
              <div
                key={f.name}
                className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                <p className="text-sm text-gray-500">{f.label}</p>
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-900 font-medium break-words">
                    {formatValue(data[f.name], f.type) || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
            Created {new Date(record.createdAt).toLocaleString()}
            {record.updatedAt.getTime() !== record.createdAt.getTime() && (
              <> · Updated {new Date(record.updatedAt).toLocaleString()}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}