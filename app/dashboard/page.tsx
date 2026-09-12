import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-700">
            Welcome, <strong>{session.user.email}</strong>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            You are authenticated. SheetForge foundation is complete.
          </p>
        </div>
      </div>
    </div>
  );
}