import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PublicRecordsTable from "./PublicRecordsTable";
import { computeChartData } from "@/lib/charts/compute";
import { describeChart } from "@/lib/charts/insight";
import { generateSummary } from "@/lib/summary/generate";
import Charts from "@/app/app/[id]/Charts";
import Pagination from "@/app/app/[id]/Pagination";
import ThemeWrapper from "@/app/app/[id]/ThemeWrapper";
import EntityTabs from "@/app/app/[id]/EntityTabs";
import { styleForValue, styleClasses } from "@/lib/conditional/rules";
import PivotPanel from "@/app/app/[id]/PivotPanel";
export const dynamic = "force-dynamic";
import Link from "next/link";

export default async function PublicAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; entity?: string; view?: string }>;
}) {
  const { slug } = await params;
    const {
    page: pageParam,
    entity: entityParam,
    view: viewParam,
  } = await searchParams;
  const showPivot = viewParam === "pivot";
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const PAGE_SIZE = 25;

  const application = await prisma.application.findUnique({
    where: { slug },
  });

  if (!application || application.visibility !== "PUBLIC") {
    notFound();
  }

  const definition = application.definition as any;
  if (!definition) notFound();

  const allEntities: any[] = [
    definition.primaryEntity,
    ...(definition.supportingEntities || []),
  ].filter(Boolean);

  const currentEntity =
    allEntities.find((e) => e.name === entityParam) || allEntities[0];

  const entityName = currentEntity.name;

  const allRecords = await prisma.record.findMany({
    where: { applicationId: application.id, entityName },
    orderBy: { createdAt: "asc" },
  });

  const allRecordObjects = allRecords.map((r) => ({
    id: r.id,
    data: r.data as Record<string, any>,
  }));

  const totalCount = allRecordObjects.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const records = allRecordObjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const summarySentences = generateSummary(
    allRecordObjects,
    currentEntity,
    application.name
  );

  const visibleFields = (currentEntity.fields || []).filter(
    (f: any) => f.visible !== false
  );

  const isPrimary = currentEntity.name === definition.primaryEntity.name;

  const metrics = isPrimary
    ? computeMetrics(allRecordObjects, definition.dashboard?.metrics || [])
    : [{ label: "Total Records", value: String(totalCount) }];

  const chartDefs = isPrimary ? (definition.charts || []).slice(0, 3) : [];
  const chartInfo = chartDefs.map((chart: any) => {
    const data = computeChartData(allRecordObjects, chart);
    const { purpose, insight } = describeChart(chart, data);
    return { chart, data, purpose, insight };
  });

  const theme = application.theme || "default";
  const logoUrl = application.logoUrl;

  return (
    <ThemeWrapper theme={theme}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-8 w-8 object-contain rounded"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {application.name}
                </h1>
                <p className="text-xs text-gray-500">
                  {totalCount} {totalCount === 1 ? "record" : "records"} · View
                  only
                </p>
              </div>
            </div>
          </div>

          {allEntities.length > 1 && (
            <EntityTabs
              entities={allEntities.map((e) => ({
                name: e.name,
                label: e.name,
              }))}
              currentEntity={currentEntity.name}
              basePath={`/a/${slug}`}
            />
          )}
        </div>

        <div className="max-w-6xl mx-auto p-6">
          {summarySentences.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch rounded-full mt-1 theme-accent-bar"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Summary
                  </p>
                  <div className="space-y-1">
                    {summarySentences.map((s, i) => (
                      <p
                        key={i}
                        className="text-sm text-gray-700 leading-relaxed"
                      >
                        {s}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className={`mb-6 grid gap-4 grid-cols-2 ${
              metrics.length >= 4
                ? "sm:grid-cols-4"
                : metrics.length === 3
                  ? "sm:grid-cols-3"
                  : "sm:grid-cols-2"
            }`}
          >
            {metrics.map((m, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {chartInfo.length > 0 && <Charts charts={chartInfo} />}

                              <div className="mb-4 flex items-center justify-end">
            <div className="border border-gray-200 rounded-md p-0.5 flex">
              <Link
                href={`/a/${slug}?entity=${encodeURIComponent(entityName)}`}
                className={`px-3 py-1 text-xs rounded ${
                  !showPivot
                    ? "theme-accent-bg text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Records
              </Link>
              <Link
                href={`/a/${slug}?entity=${encodeURIComponent(
                  entityName
                )}&view=pivot`}
                className={`px-3 py-1 text-xs rounded ${
                  showPivot
                    ? "theme-accent-bg text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pivot
              </Link>
            </div>
          </div>

          {showPivot ? (
            <div className="bg-white rounded-lg shadow">
              <PivotPanel
                records={allRecordObjects}
                fields={visibleFields}
              />
            </div>
          ) : (
            <>
              <PublicRecordsTable
                fields={visibleFields}
                records={records}
                rules={definition.conditionalRules || []}
              />

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  basePath={`/a/${slug}?entity=${encodeURIComponent(
                    entityName
                  )}`}
                />
              )}
            </>
          )}
        </div>
      </div>
    </ThemeWrapper>
  );
}

function computeMetrics(
  records: { id: string; data: Record<string, any> }[],
  metricDefs: any[]
): { label: string; value: string }[] {
  const results: { label: string; value: string }[] = [];

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