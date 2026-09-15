import { auth } from "@/auth";
import Charts from "./Charts";
import { computeChartData } from "@/lib/charts/compute";
import { generateSummary } from "@/lib/summary/generate";
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

    const recordObjects = records.map((r) => ({
    id: r.id,
    data: r.data as Record<string, any>,
  }));

  const metrics = computeMetrics(
    recordObjects,
    definition.dashboard?.metrics || [],
    definition
  );

  const chartDefs = (definition.charts || []).slice(0, 3);
  const chartData = chartDefs.map((c: any) => computeChartData(recordObjects, c));

    const summarySentences = generateSummary(
    recordObjects,
    definition.primaryEntity,
    application.name
  );

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
                        {summarySentences.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-3">
              <div className="w-1 self-stretch bg-black rounded-full mt-1"></div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Summary
                </p>
                <div className="space-y-1">
                  {summarySentences.map((s, i) => (
                    <p key={i} className="text-sm text-gray-700 leading-relaxed">
                      {s}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
                
                <div
          className={`mb-6 grid gap-4 ${
            metrics.length >= 4
              ? "grid-cols-4"
              : metrics.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
          }`}
        >
          {metrics.map((m, i) => (
            <MetricCard key={i} label={m.label} value={m.value} />
          ))}
        </div>

        {chartDefs.length > 0 && (
          <Charts charts={chartDefs} dataByChart={chartData} />
        )}

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

function computeMetrics(
  records: { id: string; data: Record<string, any> }[],
  metricDefs: any[],
  definition: any
): { label: string; value: string }[] {
  const results: { label: string; value: string }[] = [];

  // Always include total count
  results.push({ label: "Total Records", value: records.length.toString() });

  for (const metric of metricDefs || []) {
    if (metric.type === "count") {
      results.push({
        label: metric.label,
        value: records.length.toString(),
      });
      continue;
    }

    if (metric.type === "sum" && metric.field) {
      const sum = records.reduce((acc, r) => {
        const v = Number(r.data[metric.field]);
        return acc + (isNaN(v) ? 0 : v);
      }, 0);
      results.push({
        label: metric.label,
        value: formatNumber(sum),
      });
      continue;
    }

    if (metric.type === "average" && metric.field) {
      const valid = records
        .map((r) => Number(r.data[metric.field]))
        .filter((n) => !isNaN(n));
      const avg = valid.length
        ? valid.reduce((a, b) => a + b, 0) / valid.length
        : 0;
      results.push({
        label: metric.label,
        value: formatNumber(avg),
      });
      continue;
    }
  }

  return results.slice(0, 4);
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}