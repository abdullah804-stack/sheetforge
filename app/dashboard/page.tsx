import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { AvatarMenu, NavButton } from "./DashboardControls";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
      },
      appMemberships: {
        include: {
          application: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const applications = user?.applications ?? [];
  const sharedApps = (user?.appMemberships ?? [])
    .map((m) => ({
      ...m.application,
      role: m.role,
    }))
    .filter((a) => a.status !== "DELETED");

  const totalRecords = await countRecords(applications.map((a) => a.id));

  const email = session.user.email;
  const firstName =
    user?.name?.trim().split(" ")[0] || email.split("@")[0];
  const initial = firstName.charAt(0).toUpperCase();

  const stats = [
    { label: "Applications", value: applications.length },
    { label: "Records", value: totalRecords },
    { label: "Shared with me", value: sharedApps.length },
  ];

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="relative z-20 flex items-start justify-between gap-4 mb-8 animate-fade-up">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {plural(applications.length, "application")} ·{" "}
              {plural(totalRecords, "total record")}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              You're a SheetForger.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block">
              <NavButton href="/dashboard/create" variant="primary" size="md">
                + Create New App
              </NavButton>
            </div>
            <AvatarMenu
              initial={initial}
              email={email}
              signOutAction={signOutAction}
            />
          </div>
        </header>

        <div className="sm:hidden -mt-4 mb-8">
          <NavButton
            href="/dashboard/create"
            variant="primary"
            size="md"
            className="w-full"
          >
            + Create New App
          </NavButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card
              key={stat.label}
              className="p-5 animate-fade-up"
              style={{ animationDelay: `${(i + 1) * 50}ms` }}
            >
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">
                {stat.value.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        {/* Shared with me */}
        {sharedApps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              Shared with me
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedApps.map((app, i) => (
                <Link
                  key={app.id}
                  href={`/app/${app.id}`}
                  className="block h-full animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <Card interactive className="h-full">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 min-w-0 truncate">
                        {app.name}
                      </h3>
                      <span
                        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded capitalize ${
                          app.role === "editor"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {app.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Type: {app.type}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Applications list */}
        {applications.length === 0 ? (
          <Card className="p-12 text-center max-w-lg mx-auto animate-fade-up">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No applications yet
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Upload a spreadsheet and we'll turn it into a clean,
              easy-to-understand application in seconds.
            </p>
            <NavButton href="/dashboard/create" variant="primary" size="lg">
              Create your first app
            </NavButton>
          </Card>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              Your applications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applications.map((app, i) => (
                <Link
                  key={app.id}
                  href={`/dashboard/app/${app.id}`}
                  className="block h-full animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <Card interactive className="h-full">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 min-w-0 truncate">
                        {app.name}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-500">Type: {app.type}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function plural(n: number, word: string) {
  return `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
}

// Approximate: sums the row counts stored in each workbook's parsed data.
// Assumes Workbook has `applicationId` and `parsedData.sheets[].rowCount`.
// Falls back to 0 if the query can't run.
async function countRecords(applicationIds: string[]): Promise<number> {
  if (applicationIds.length === 0) return 0;

  try {
    const workbooks = await (prisma as any).workbook.findMany({
      where: { applicationId: { in: applicationIds } },
      select: { parsedData: true },
    });

    return workbooks.reduce(
      (total: number, wb: any) =>
        total +
        (wb.parsedData?.sheets ?? []).reduce(
          (sum: number, sheet: any) => sum + (sheet.rowCount ?? 0),
          0
        ),
      0
    );
  } catch {
    return 0;
  }
}

type BadgeIcon = "check" | "dot" | "alert";

function badgeFor(status: string): {
  label: string;
  className: string;
  icon: BadgeIcon;
} {
  switch (status) {
    case "READY":
      return {
        label: "Ready to use",
        className: "bg-green-50 text-green-700",
        icon: "check",
      };
    case "PUBLISHED":
      return {
        label: "Published",
        className: "bg-green-50 text-green-700",
        icon: "check",
      };
    case "GENERATED":
      return {
        label: "Built",
        className: "bg-blue-50 text-blue-700",
        icon: "dot",
      };
    case "PARSED":
      return {
        label: "File read",
        className: "bg-blue-50 text-blue-700",
        icon: "dot",
      };
    case "UPLOADED":
      return {
        label: "File uploaded",
        className: "bg-gray-100 text-gray-600",
        icon: "dot",
      };
    case "DRAFT":
      return {
        label: "Not started",
        className: "bg-gray-100 text-gray-600",
        icon: "dot",
      };
    case "PARSE_FAILED":
      return {
        label: "Could not read file",
        className: "bg-red-50 text-red-700",
        icon: "alert",
      };
    case "FAILED":
      return {
        label: "Failed",
        className: "bg-red-50 text-red-700",
        icon: "alert",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-600",
        icon: "dot",
      };
  }
}

function StatusBadge({ status }: { status: string }) {
  const badge = badgeFor(status);

  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${badge.className}`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {badge.icon === "check" && <path d="M5 13l4 4L19 7" />}
        {badge.icon === "dot" && (
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
        )}
        {badge.icon === "alert" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </>
        )}
      </svg>
      {badge.label}
    </span>
  );
}