import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="h-8 w-1/3 rounded-full bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="h-10 w-10 rounded-2xl bg-slate-200" />
                <div className="h-4 w-16 rounded-full bg-slate-200" />
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-5 w-3/4 rounded-full bg-slate-200" />
                <div className="h-8 w-full rounded-2xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-6 w-1/4 rounded-full bg-slate-200" />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 px-6 py-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            ))}
          </div>
          <div className="divide-y divide-slate-200">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-6 w-10 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-6 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
