import Link from "next/link";

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  const pages: (number | "…")[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <Link
        href={`${basePath}?page=${Math.max(1, currentPage - 1)}`}
        className={`px-3 py-1.5 text-sm rounded border border-gray-200 ${
          currentPage === 1
            ? "text-gray-300 pointer-events-none"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        ←
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={i} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={i}
            href={`${basePath}?page=${p}`}
            className={`px-3 py-1.5 text-sm rounded border ${
              p === currentPage
                ? "bg-black text-white border-black"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={`${basePath}?page=${Math.min(totalPages, currentPage + 1)}`}
        className={`px-3 py-1.5 text-sm rounded border border-gray-200 ${
          currentPage === totalPages
            ? "text-gray-300 pointer-events-none"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        →
      </Link>
    </div>
  );
}