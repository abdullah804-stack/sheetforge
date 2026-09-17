"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface EntityTab {
  name: string;
  label: string;
}

export default function EntityTabs({
  entities,
  currentEntity,
  basePath,
}: {
  entities: EntityTab[];
  currentEntity: string;
  basePath: string;
}) {
  return (
    <div className="border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex overflow-x-auto">
        {entities.map((e) => {
          const isActive = e.name === currentEntity;
          return (
            <Link
              key={e.name}
              href={`${basePath}?entity=${encodeURIComponent(e.name)}`}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                isActive
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {e.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}