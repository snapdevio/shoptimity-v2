"use client"

import { Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

export default function BlogSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")

  const handleSearch = (term: string) => {
    setSearchTerm(term)
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

  const clearSearch = () => {
    setSearchTerm("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="relative w-full md:w-80">
      <Search
        className={`absolute top-1/2 left-4 size-5 -translate-y-1/2 transition-all duration-300 ${
          isPending ? "animate-pulse text-[#ff602e]" : "text-gray-400"
        }`}
      />
      <input
        type="text"
        placeholder="Search articles..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full rounded-full border border-gray-200 bg-white py-3 pr-10 pl-12 text-sm shadow-sm transition-all duration-300 placeholder:text-gray-400 focus:border-[#ff602e] focus:bg-white focus:shadow-md focus:ring-2 focus:ring-orange-100 focus:outline-none"
      />
      {searchTerm ? (
        <button
          onClick={clearSearch}
          className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="size-4" />
        </button>
      ) : isPending ? (
        <div className="absolute top-1/2 right-4 -translate-y-1/2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#ff602e]" />
        </div>
      ) : null}
    </div>
  )
}
