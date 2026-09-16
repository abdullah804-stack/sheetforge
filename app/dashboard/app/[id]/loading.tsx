export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <div className="skeleton h-5 w-40 mb-2"></div>
            <div className="skeleton h-3 w-24"></div>
          </div>
          <div className="skeleton h-8 w-32"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Summary skeleton */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="skeleton h-4 w-20 mb-3"></div>
          <div className="skeleton h-3 w-3/4 mb-2"></div>
          <div className="skeleton h-3 w-2/3"></div>
        </div>

        {/* Metrics skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="skeleton h-3 w-16 mb-2"></div>
              <div className="skeleton h-6 w-20"></div>
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="skeleton h-4 w-32 mb-4"></div>
              <div className="skeleton h-48 w-full"></div>
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="skeleton h-9 w-64"></div>
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-6 w-full"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}