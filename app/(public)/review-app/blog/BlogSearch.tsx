"use client"

import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export default function BlogSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentQuery = searchParams.get("q") || ""

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set("q", term)
    } else {
      params.delete("q")
    }

    // Use transition to make navigation smoother
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="relative w-full md:w-72">
      <Search
        className={`absolute top-1/2 left-3 size-4 -translate-y-1/2 transition-colors ${isPending ? "animate-pulse text-brand-orange" : "text-muted-foreground"}`}
      />
      <input
        type="text"
        placeholder="Search articles..."
        defaultValue={currentQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full rounded-full border border-gray-100 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm transition-all focus:ring-2 focus:ring-brand-orange/20 focus:outline-none"
      />
    </div>
  )
}
