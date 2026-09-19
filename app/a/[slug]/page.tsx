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
import type { CSSProperties } from "react";
export const dynamic = "force-dynamic";
import Link from "next/link";

// Entrance-animation helper. Sets both animation and transition delays so the
// stagger works whether the utility class uses keyframes or transitions.
function stagger(ms: number): CSSProperties {
  return {
    animationDelay: `${ms}ms`,
    transitionDelay: `${ms}ms`,
    animationFillMode: "both",
  };
}

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

  const toggleBase =
    "px-3 py-1.5 text-xs font-medium rounded transition-all duration-150";
  const toggleActive = "bg-white shadow-sm text-gray-900";
  const toggleInactive = "text-gray-500 hover:text-gray-900";

  return (
    <ThemeWrapper theme={theme}>
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 animate-fade-in">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
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
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>
                    {totalCount} {totalCount === 1 ? "record" : "records"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">
                    View only
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Entity tabs */}
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

        {/* Content */}
        <div className="max-w-6xl mx-auto p-6">
          {/* Summary */}
          {summarySentences.length > 0 && (
            <div
              className="mb-6 bg-white rounded-lg shadow p-6 animate-fade-up"
              style={stagger(0)}
            >
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch rounded-full mt-1 theme-accent-bar"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="text-gray-500 shrink-0"
                    >
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                      <path d="M20 3v4" />
                      <path d="M22 5h-4" />
                      <path d="M4 17v2" />
                      <path d="M5 18H3" />
                    </svg>
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

          {/* Metrics */}
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
              <MetricCard
                key={i}
                label={m.label}
                value={m.value}
                index={i}
              />
            ))}
          </div>

          {/* Charts — primary entity only */}
          {chartInfo.length > 0 && (
            <div
              className="animate-fade-up"
              style={stagger(metrics.length * 50 + 50)}
            >
              <Charts charts={chartInfo} />
            </div>
          )}

          {/* View toggle */}
          <div className="mb-4 flex items-center justify-end">
            <div className="inline-flex bg-gray-100 rounded-md p-0.5">
              <Link
                href={`/a/${slug}?entity=${encodeURIComponent(entityName)}`}
                className={`${toggleBase} ${
                  !showPivot ? toggleActive : toggleInactive
                }`}
              >
                Records
              </Link>
              <Link
                href={`/a/${slug}?entity=${encodeURIComponent(
                  entityName
                )}&view=pivot`}
                className={`${toggleBase} ${
                  showPivot ? toggleActive : toggleInactive
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
              {records.length === 0 ? (
                <EmptyState />
              ) : (
                <PublicRecordsTable
                  fields={visibleFields}
                  records={records}
                  rules={definition.conditionalRules || []}
                />
              )}

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

          {/* Footer badge */}
          <footer className="mt-8 py-8 border-t border-gray-100 text-center">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
            >
              Made with <span className="font-bold">SheetForge</span>
            </Link>
          </footer>
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

function MetricCard({
  label,
  value,
  index,
}: {
  label: string;
  value: string;
  index: number;
}) {
  // The outer wrapper owns the entrance animation; the inner card owns the
  // hover lift, so the two transforms never fight each other.
  return (
    <div className="animate-fade-up" style={stagger(index * 50)}>
      <div className="bg-white rounded-lg shadow p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-lg shadow px-6 py-12 flex flex-col items-center text-center animate-fade-up">
      <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-3">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-900">No records yet</p>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">
        Records will appear here once they are added to this table.
      </p>
    </div>
  );
}