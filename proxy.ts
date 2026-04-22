import { NextRequest, NextResponse } from "next/server"
import { betterFetch } from "@better-fetch/fetch"

const AUTH_PATHS = ["/login", "/verify"]

const DASHBOARD_PATHS = [
  "/licenses",
  "/templates",
  "/profile",
  "/payments",
  "/admin",
]

const ADMIN_PATHS = ["/admin"]

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

type SessionResponse = {
  session: {
    id: string
    userId: string
    expiresAt: string
  }
  user: {
    id: string
    email: string
    role: string
  }
} | null

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Only check session for auth paths and dashboard paths
  if (!isAuthPath(pathname) && !isDashboardPath(pathname)) {
    return NextResponse.next()
  }

  // Fetch session from Better Auth
  const baseURL =
    process.env.AUTH_BASE_URL || `http://localhost:${process.env.PORT || 3000}`
  const { data: sessionData } = await betterFetch<SessionResponse>(
    "/api/auth/get-session",
    {
      baseURL,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  )

  const isAuthenticated = !!sessionData?.session

  // Redirect authenticated users away from auth pages
  if (isAuthPath(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/licenses", request.url))
  }

  // Protect dashboard paths
  if (isDashboardPath(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin-only paths
    if (isAdminPath(pathname) && sessionData?.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/licenses", request.url))
    }

    // Attach user info to headers for server components
    const response = NextResponse.next()
    response.headers.set("x-user-id", sessionData!.user.id)
    response.headers.set("x-user-role", sessionData!.user.role)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
