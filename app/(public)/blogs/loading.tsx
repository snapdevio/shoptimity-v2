export default function Loading() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Header Skeleton */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 h-16 w-3/4 animate-pulse rounded-2xl bg-gray-200 md:w-1/2" />
          <div className="mx-auto h-12 w-full animate-pulse rounded-xl bg-gray-100 md:w-2/3" />
        </div>

        {/* Search & Categories Skeleton */}
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-wrap justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 w-20 animate-pulse rounded-full bg-gray-100"
              />
            ))}
          </div>
          <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 md:w-64" />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Main Content Skeleton */}
          <main className="flex-1">
            {/* Featured Post Skeleton */}
            <div className="mb-10 flex flex-col gap-6 overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-lg shadow-gray-200/50 lg:flex-row lg:items-stretch">
              {/* Content */}
              <div className="flex flex-1 flex-col gap-4 p-8 lg:gap-6 lg:p-10">
                <div className="h-8 w-28 animate-pulse rounded-full bg-orange-100" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-orange-50" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-orange-50" />
                </div>
                <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
                <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="h-5 w-24 animate-pulse rounded bg-orange-100" />
              </div>
              {/* Image */}
              <div className="aspect-4/3 w-full animate-pulse bg-gray-100 lg:w-1/2" />
            </div>

            {/* Regular Posts Grid Skeleton */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="flex flex-col overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-md shadow-gray-200/30"
                >
                  <div className="aspect-video w-full animate-pulse bg-gray-100" />
                  <div className="flex flex-col gap-3 p-6">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="h-14 w-full animate-pulse rounded-xl bg-gray-200" />
                    <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-5 w-28 animate-pulse rounded bg-orange-100" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <div className="h-10 w-24 animate-pulse rounded-full bg-gray-100" />
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 animate-pulse rounded-full bg-gray-100"
                  />
                ))}
              </div>
              <div className="h-10 w-24 animate-pulse rounded-full bg-gray-100" />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
