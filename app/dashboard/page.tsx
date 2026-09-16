import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const applications = user
    ? await prisma.application.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-500 text-sm mt-1">
              Signed in as {session.user.email}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Create new app button */}
        <Link
          href="/dashboard/create"
          className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 mb-8"
        >
          + Create New App
        </Link>

        {/* Applications list */}
        {applications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
            <Link
              href="/dashboard/create"
              className="inline-block bg-black text-white px-5 py-2.5 rounded-md hover:bg-gray-800 transition"
            >
              Create your first app
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app: (typeof applications)[number]) => (
              <Link
                key={app.id}
                href={`/dashboard/app/${app.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition block"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {app.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      app.status === "READY"
                        ? "bg-green-100 text-green-700"
                        : app.status === "PUBLISHED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">
                  Type: {app.type}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Created {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}