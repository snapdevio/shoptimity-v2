export default function Loading() {
  return (
    <article className="min-h-screen bg-base-100">
      {/* Header Skeleton */}
      <header className="relative overflow-hidden pt-16 pb-10 md:pt-24">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-pink-50/30 to-transparent" />

        <div className="relative container mx-auto max-w-6xl px-4">
          <div className="mb-8 h-10 w-40 animate-pulse rounded-full border border-orange-200 bg-slate-50" />

          {/* Tags & Meta Skeleton */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="h-7 w-24 animate-pulse rounded-full bg-gradient-to-r from-orange-200 to-pink-200" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-gradient-to-r from-orange-200 to-pink-200" />
            <div className="hidden h-4 w-px bg-gray-200 sm:inline" />
            <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
            <div className="hidden h-4 w-px bg-gray-200 sm:inline" />
            <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          </div>

          {/* Title Skeleton */}
          <div className="h-12 w-3/4 animate-pulse rounded-xl bg-gray-200 md:h-16 lg:h-20" />
        </div>
      </header>

      {/* Content Skeleton */}
      <div className="relative container mx-auto max-w-6xl px-4 pb-6 md:pb-12">
        {/* Image Skeleton */}
        <div className="mb-10 aspect-video w-full animate-pulse overflow-hidden rounded-[2rem] bg-gray-100 shadow-2xl shadow-gray-200/50 md:mb-14" />

        {/* Article Body Skeleton */}
        <div className="rounded-[2rem] border border-gray-100 bg-slate-50 p-6 shadow-xl shadow-gray-200/30 md:p-10 lg:p-12">
          <div className="space-y-6">
            <div className="h-8 w-2/3 animate-pulse rounded-xl bg-gray-200" />
            <div className="space-y-3">
              <div className="h-5 w-full animate-pulse rounded bg-gray-200/50" />
              <div className="h-5 w-full animate-pulse rounded bg-gray-200/50" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200/50" />
            </div>
            <div className="h-48 w-full animate-pulse rounded-2xl bg-gray-200/30" />
            <div className="space-y-3">
              <div className="h-5 w-full animate-pulse rounded bg-gray-200/50" />
              <div className="h-5 w-full animate-pulse rounded bg-gray-200/50" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Read More Section Skeleton */}
      <section className="border-t border-gray-100 bg-white/50 py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-14 text-center">
            <div className="mx-auto mb-4 h-5 w-32 animate-pulse rounded bg-orange-100" />
            <div className="mx-auto h-12 w-64 animate-pulse rounded-xl bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-lg shadow-gray-200/30"
              >
                <div className="aspect-video w-full animate-pulse bg-gray-100" />
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
                  <div className="h-8 w-full animate-pulse rounded-lg bg-gray-100" />
                  <div className="h-5 w-24 animate-pulse rounded bg-orange-50" />
                </div>
              </div>
            ))}
          </div>

          {/* View All Button Skeleton */}
          <div className="mt-14 flex justify-center">
            <div className="h-14 w-48 animate-pulse rounded-full bg-gradient-to-r from-orange-200 to-pink-200" />
          </div>
        </div>
      </section>
    </article>
  )
}
