export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="skeleton h-8 w-48 mb-2"></div>
            <div className="skeleton h-3 w-40"></div>
          </div>
          <div className="skeleton h-8 w-20"></div>
        </div>

        <div className="skeleton h-9 w-40 mb-8"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="skeleton h-5 w-32 mb-3"></div>
              <div className="skeleton h-3 w-24 mb-2"></div>
              <div className="skeleton h-3 w-40"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}