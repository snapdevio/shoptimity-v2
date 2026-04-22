import Navbar from "@/components/site/Navbar"
import NotFoundContent from "@/components/site/NotFoundContent"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-base-100">
      <Navbar />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 md:px-10">
        <NotFoundContent />
      </main>
    </div>
  )
}
