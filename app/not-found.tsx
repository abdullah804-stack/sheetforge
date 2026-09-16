import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-mono text-gray-400 mb-4">404</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist, or you don't have access
          to it.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800 transition"
          >
            My dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}